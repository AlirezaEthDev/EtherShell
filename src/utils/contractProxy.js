export function createContractProxy(contract, provider, allAccounts) {
  return new Proxy(contract, {
    get(target, prop) {
      if (typeof target[prop] !== 'function') {
        return target[prop];
      }

      return async function(...args) {
        const lastArg = args[args.length - 1];
        
        const validTxOptions = [
          'value',
          'nonce',
          'gasLimit',
          'gas',
          'gasPrice',
          'maxFeePerGas',
          'maxPriorityFeePerGas',
          'chainId',
          'accessList',
          'type',
          'customData',
          'from'
          // NOTE: 'data' is intentionally excluded - it's auto-encoded by ethers.js
        ];

        const hasOptions = 
          lastArg && 
          typeof lastArg === 'object' && 
          !Array.isArray(lastArg) &&
          Object.keys(lastArg).some(key => validTxOptions.includes(key));

        // Optional: Warn if user tries to pass 'data'
        if (lastArg && typeof lastArg === 'object' && lastArg.data) {
          console.warn(
            "⚠️  Warning: 'data' option is ignored. " +
            "Function calldata is automatically encoded by ethers.js. " +
            "Use .connect() to change the signer if needed."
          );
        }

        const options = hasOptions ? args.pop() : null;

        // ... rest of proxy logic ...
      };
    }
  });
}
