// src/utils/contractProxy.js
import { ethers } from 'ethers';

/**
 * Creates a proxy wrapper for ethers.js Contract objects
 * Allows dynamic sender changes and comprehensive transaction options
 * 
 * @param {ethers.Contract} contract - The ethers.js contract instance
 * @param {ethers.JsonRpcProvider} provider - The blockchain provider
 * @param {Array} allAccounts - Array of available accounts with privateKey property
 * @returns {Proxy} Proxied contract object
 * 
 * @example
 * // Call with comprehensive options
 * await Payment.spend(amount, {
 *   from: '0x...',
 *   value: ethers.parseEther('1'),
 *   gasLimit: 500000,
 *   maxFeePerGas: ethers.parseUnits('100', 'gwei'),
 *   maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
 *   nonce: 42,
 *   chainId: 1
 * })
 */
export function createContractProxy(contract, provider, allAccounts) {
  return new Proxy(contract, {
    get(target, prop) {
      // Pass through non-function properties
      if (typeof target[prop] !== 'function') {
        return target[prop];
      }

      // Return a wrapper for contract methods
      return async function(...args) {
        // Extract options from last argument if it's an object with custom properties
        const lastArg = args[args.length - 1];
        
        // List of all valid transaction option keys (except 'data', 'to', 'from' which are handled internally)
        const validTxOptions = [
          'value',
          'nonce',
          'gasLimit',
          'gas', // Maps to gasLimit
          'gasPrice',
          'maxFeePerGas',
          'maxPriorityFeePerGas',
          'chainId',
          'accessList',
          'type',
          'customData',
          'from' // Special handling for signer switching
        ];

        const hasOptions = 
          lastArg && 
          typeof lastArg === 'object' && 
          !Array.isArray(lastArg) &&
          Object.keys(lastArg).some(key => validTxOptions.includes(key));

        // Warn if user tries to pass 'data'
        if (lastArg && typeof lastArg === 'object' && lastArg.data) {
          console.warn(
            "Warning: 'data' option is ignored. " +
            "Function calldata is automatically encoded by ethers.js. " +
            "Use .connect() to change the signer if needed."
          );
        }

        const options = hasOptions ? args.pop() : null;

        let method = target[prop];
        let txOptions = {};

        // Handle 'from' option - switch signer if specified
        if (options && options.from) {
          const account = allAccounts.find(
            acc => acc.address?.toLowerCase() === options.from.toLowerCase()
          );

          if (!account) {
            throw new Error(
              `Account ${options.from} not found in registered accounts`
            );
          }

          if (!account.privateKey) {
            throw new Error(
              `Account ${options.from} is a node-managed account and cannot be used with {from}`
            );
          }

          // Create new signer with the specified account
          const newSigner = new ethers.Wallet(account.privateKey, provider);
          const connectedContract = target.connect(newSigner);
          method = connectedContract[prop];
        }

        // Build transaction options object with all supported ethers.js v6 options
        if (options) {
          // Value (for payable functions)
          if (options.value !== undefined) {
            txOptions.value = options.value;
          }

          // Gas limit (handle both 'gas' and 'gasLimit')
          if (options.gasLimit !== undefined) {
            txOptions.gasLimit = options.gasLimit;
          } else if (options.gas !== undefined) {
            txOptions.gasLimit = options.gas; // Map 'gas' to 'gasLimit'
          }

          // Legacy gas price
          if (options.gasPrice !== undefined) {
            txOptions.gasPrice = options.gasPrice;
          }

          // EIP-1559 options
          if (options.maxFeePerGas !== undefined) {
            txOptions.maxFeePerGas = options.maxFeePerGas;
          }

          if (options.maxPriorityFeePerGas !== undefined) {
            txOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
          }

          // Nonce for transaction ordering
          if (options.nonce !== undefined) {
            txOptions.nonce = options.nonce;
          }

          // Chain ID
          if (options.chainId !== undefined) {
            txOptions.chainId = options.chainId;
          }

          // EIP-2930 access list
          if (options.accessList !== undefined) {
            txOptions.accessList = options.accessList;
          }

          // Transaction type
          if (options.type !== undefined) {
            txOptions.type = options.type;
          }

          // Custom data (for special networks like zkSync)
          if (options.customData !== undefined) {
            txOptions.customData = options.customData;
          }
        }

        // If there are transaction options, pass them as the last argument
        if (Object.keys(txOptions).length > 0) {
          args.push(txOptions);
        }

        // Call the method with remaining args and tx options
        const result = await method.apply(method, args);

        // Check if result is a transaction response (has wait method)
        if (result && typeof result.wait === 'function') {
          // This is a transaction - wait for mining
          const receipt = await result.wait();
          return receipt;
        }

        // This is a view/pure function result - return as-is
        return result;
      };
    }
  });
}
