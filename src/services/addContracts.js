/**
 * @fileoverview Smart contract deployment and management
 * @description Provides functions to deploy new smart contracts and add existing
 * contracts to the EtherShell environment. Manages contract instances and integrates
 * them with the REPL context.
 * @module addContracts
 */

import { ethers } from 'ethers';
import fs from 'fs';
import { 
    provider,
    configFile
 } from './configSync.js';
import { allAccounts } from './wallet.js';
import { LocalStorage } from 'node-localstorage';
import { r } from '../../bin/cli.js';
import { createContractProxy } from '../utils/contractProxy.js';
import { eventOf } from '../utils/event.js';
import {
    getContractJSON,
    appendContract
} from '../utils/contractLister.js';
import { serializeBigInts } from '../utils/serialize.js';

/**
 * Local storage instance for persisting contract metadata
 * @type {LocalStorage}
 */
const localStorage = new LocalStorage('./ethershell');

/**
 * Map of all deployed and added contracts
 * @type {Map<string, ethers.Contract>}
 */
export const contracts = getContractJSON();

/**
 * The path which in contracts json file will be saved.
 * @type {String}
 */
const contractsJSONPath = './ethershell/contracts.json';

/**
 * Instantiate stored contracts to interact with the shell
 */
export async function restore() {
  if (contracts.length === 0) {
    return 'The storage is empty!';
  }

  console.info('Stored contracts instantiating ...');

  for (const record of contracts) {
    const result = await _add(
      record.name,
      record.address,
      configFile.defaultWallet.index,
      record.abiPath
    );

    result.proxiedContract._contractIndex = record.index;
    result.proxiedContract._contractDeployType = record.deployType;
  }

  console.info('All stored contracts instantiated!');
}


/**
 * Deploy a new smart contract to the blockchain
 * @async
 * @param {string} contractName - Name of the contract to deploy
 * @param {Array} [args=[]] - Constructor arguments for the contract
 * @param {number} [accIndex=0] - Index of the account to deploy from
 * @param {string} [chain] - Optional custom chain URL
 * @param {string} [abiLoc] - Optional custom ABI file location
 * @param {string} [bytecodeLoc] - Optional custom bytecode file location
 * @returns {Promise<void>}
 * @throws {Error} If contract name is empty, account index is out of range, or deployment fails
 * @example
 * deploy('MyToken', [1000000], 0);
 */
export async function deploy(contractName, args, accIndex, chain, abiLoc, bytecodeLoc) {
    try {
        let currentProvider;
        let connectedChain;
        let wallet;

        if(!contractName) {
            throw new Error('Contract name is empty');
        }

        const contractArgs = args || [];

        if(accIndex > allAccounts.length - 1) {
            throw new Error('Wallet index is out of range');
        }

        if(chain) {
            currentProvider = new ethers.JsonRpcProvider(chain);
        } else {
            currentProvider = provider;
        }

        if(!accIndex && accIndex !== 0) {
            accIndex = configFile.defaultWallet.index;
        }

        wallet = new ethers.Wallet(allAccounts[accIndex].privateKey, currentProvider);
        connectedChain = await currentProvider.getNetwork();

        const abiPath = abiLoc || localStorage.getItem(`${contractName}_abi`);
        const bytecodePath = bytecodeLoc || localStorage.getItem(`${contractName}_bytecode`);

        const abi  = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        const bytecode = JSON.parse(fs.readFileSync(bytecodePath, 'utf8'));

        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        const deployTx = await factory.deploy(...contractArgs);
        await deployTx.waitForDeployment();

        // Update deployer contract list
        const contSpec = {
            address: deployTx.target,
            deployedOn: connectedChain.name,
            chainId: connectedChain.chainId
        }

        allAccounts[accIndex].contracts.push(contSpec);

        // Decorate contract instance with metadata
        deployTx._contractName = contractName;
        deployTx._contractChain = connectedChain.name;
        deployTx._contractChainId = connectedChain.chainId;
        deployTx._contractDeployType = 'ethershell-deployed',
        deployTx._contractProvider = currentProvider;

        //////////////////////////////////

        // Create contract proxy
        // Get the contract instance from ethers
        const contractAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        const contractInstance = new ethers.Contract(deployTx.target, contractAbi, wallet);

        // Wrap the contract instace with proxy
        const proxiedContract = createContractProxy(contractInstance, currentProvider, allAccounts);

        proxiedContract._contractName = contractName;
        proxiedContract._contractChain = connectedChain.name;
        proxiedContract._contractChainId = connectedChain.chainId;
        proxiedContract._contractDeployType = 'ethershell-deployed';
        proxiedContract._contractProvider = currentProvider;
        proxiedContract._contractABIPath = abiPath;

        // Get the balance of the contract
        const balance = await currentProvider.getBalance(proxiedContract.target);

        // Create the contract record to store
        const contractRecord = {
            name: contractName,
            address: proxiedContract.target,
            chain: connectedChain.name,
            chainId: connectedChain.chainId,
            deployType: 'ethershell-deployed',
            balance,
            abiPath
        }
        
        // Store the contract record on shell memory (contracts array) and storage (contracts.json)
        const contractIndex = appendContract(contractRecord, proxiedContract);

        // Update index of the contract instance
        deployTx._contractIndex = contractIndex;

        ////////////////////////////////////////////

        const deployHash = deployTx.deploymentTransaction().hash;
        const tx = await currentProvider.getTransaction(deployHash);
        delete tx.data;

        // Get event values
        const tx1 = await currentProvider.getTransactionReceipt(deployHash);
        const eventValues = eventOf(contractInstance, tx1);

        // Decorate transaction object with metadata
        tx.ethershellIndex = deployTx._contractIndex;
        tx.address = deployTx.target;
        tx.name = deployTx._contractName;
        tx.chain = deployTx._contractChain;
        tx.deployType = deployTx._contractDeployType;

        if(eventValues) {
            tx.eventValues = eventValues;
        }
        
        return tx;
    } catch(err) {
        console.error(err);
        throw err;
    }
}

/**
 * Add an existing deployed contract to EtherShell
 * @async
 * @param {string} contractName - Name to assign to the contract
 * @param {string} contractAddr - Address of the deployed contract
 * @param {number} [accIndex=0] - Index of the account to interact with the contract
 * @param {string} abiLoc - Path to the contract ABI file
 * @param {string} [chain] - Optional custom chain URL
 * @returns {Promise<void>}
 * @throws {Error} If contract address or ABI location is null/undefined
 * @example
 * add('USDT', '0xdac17f958d2ee523a2206206994597c13d831ec7', 0, './abis/USDT.json');
 */
export async function add(contractName, contractAddr, accIndex, abiLoc, chain) {
    try {
        const result = await _add(contractName, contractAddr, accIndex, abiLoc, chain);
        
        // Get the balance of the contract
        const balance = await result.provider.getBalance(result.address);

        // Create the contract record to store
        const contractRecord = {
            name: result.name,
            address: result.address,
            chain: result.chain,
            chainId: result.chainId,
            deployType: result.deployType,
            balance,
            abiPath: result.abiPath
        }

        // Store the contract record on shell memory (contracts array) and storage (contracts.json)
        result.index = appendContract(contractRecord, result.proxiedContract);

        // Destruct result to omit proxiedContract to return
        const {proxiedContract, ...rest} = result;

        return rest;
    } catch(err) {
        console.error(err);
        throw err;
    }
}

/**
 * Remove the selected contract from memory and storage
 * @param {number} contPointer 
 */
export async function remove(contPointer) {
    // Validation the pointer
    if(typeof contPointer === 'number') {
        if(0 <= contPointer && contPointer < contracts.length) {
            // Remove the contract from contracts array and update it
            contracts.splice(contPointer, 1);
            // Update contract index
            for(let i = contPointer; i < contracts.length; i++) {
                contracts[i].index = i;
            }
            // Update contracts.json file
            const contractsObj = serializeBigInts(contracts);
            fs.writeFileSync(contractsJSONPath, JSON.stringify(contractsObj, null, 2));
            console.log(`Contract removed successfully. Memory and storage updated!`);
        } else{
            throw `The contract index is INVALID. Index must be between 0 and ${contracts.length - 1} `;
        }
    } else{
        throw `Only contract index is valid. Your input (${contPointer}) is NOT index`;
    }
}

/**
 * Instantiates an existing contract and registers its proxy in the REPL.
 *
 * Resolves the provider, wallet, and ABI; creates a proxied ethers contract;
 * attaches shell metadata; and adds a contract reference to the selected
 * wallet's in-memory contract list.
 *
 * Does not append to the contract registry or write contracts.json.
 * The caller must assign the final registry index when adding a contract,
 * or restore the saved index when reinstantiating one.
 *
 * @private
 * @async
 * @param {string} contractName
 *   Name used for REPL registration and local-storage ABI lookup.
 * @param {string} contractAddr
 *   Address of the existing deployed contract.
 * @param {number} [accIndex]
 *   Wallet index. Defaults to configFile.defaultWallet.index.
 * @param {string} [abiLoc]
 *   ABI JSON file path. Defaults to the local-storage entry
 *   `${contractName}_abi`.
 * @param {string} [chain]
 *   JSON-RPC URL. Defaults to the currently configured provider.
 * @returns {Promise<{
 *   index: number,
 *   name: string,
 *   address: string,
 *   chain: string,
 *   chainId: bigint,
 *   deployType: string,
 *   provider: import('ethers').JsonRpcProvider,
 *   abiPath: string,
 *   proxiedContract: import('ethers').Contract
 * }>}
 *   Contract metadata, the resolved ABI path, and the registered proxy.
 *   The returned index is provisional until the caller appends the record
 *   or restores its saved index.
 * @throws {Error}
 *   Rejects if the address is missing, the wallet or ABI cannot be loaded,
 *   provider communication fails, or contract initialization fails.
 */
async function _add(contractName, contractAddr, accIndex, abiLoc, chain) {
    let currentProvider;
    let connectedChain;
    let wallet;

    if(!contractAddr) {
        throw new Error('Contract address may not be null or undefined!');
    }

    if(chain) {
        currentProvider = new ethers.JsonRpcProvider(chain);
    } else {
        currentProvider = provider;
    }

    if(!accIndex && accIndex !== 0) {
        accIndex = configFile.defaultWallet.index;
    }

    wallet = new ethers.Wallet(allAccounts[accIndex].privateKey, currentProvider);
    connectedChain = await currentProvider.getNetwork();

    const abiPath = abiLoc || localStorage.getItem(`${contractName}_abi`);
    const abi  = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

    const newContract = new ethers.Contract(contractAddr, abi, wallet);

    // Create contract proxy
    // Wrap the contract instace with proxy
    const proxiedContract = createContractProxy(newContract, currentProvider, allAccounts);

    proxiedContract._contractIndex = contracts.length;
    proxiedContract._contractName = contractName;
    proxiedContract._contractChain = connectedChain.name;
    proxiedContract._contractChainId = connectedChain.chainId;
    proxiedContract._contractDeployType = 'ethershell-deployed';
    proxiedContract._contractProvider = currentProvider;
    proxiedContract._contractABIPath = abiPath;

    // Add to REPL context with proxy
    r.context[contractName] = proxiedContract;
    
    // const contracToStore = {
    //     index: proxiedContract._contractIndex,
    //     name: proxiedContract._contractName,
    //     address: proxiedContract.target,
    //     chain: proxiedContract._contractChain,
    //     chainId: proxiedContract._contractChainId,
    //     deployType: proxiedContract._contractDeployType,
    //     balance: await proxiedContract.provider.getBalance(proxiedContract.target),
    //     abiPath: proxiedContract._contractABIPath
    // }
    // contracts.push(contracToStore);

    // Update deployer contract list
    const contSpec = {
        address: newContract.target,
        deployedOn: connectedChain.name,
        chainId: connectedChain.chainId
    }

    allAccounts[accIndex].contracts.push(contSpec);

    // Decorate contract instance with metadata
    newContract._contractIndex = contracts.length;
    newContract._contractName = contractName;
    newContract._contractChain = connectedChain.name;
    newContract._contractChainId = connectedChain.chainId;
    newContract._contractDeployType = 'pre-deployed',
    newContract._contractProvider = currentProvider;

    // Add result
    const result = {
        index: newContract._contractIndex,
        name: newContract._contractName,
        address: newContract.target,
        chain: newContract._contractChain,
        chainId: newContract._contractChainId,
        deployType: newContract._contractDeployType,
        provider: newContract._contractProvider,
        abiPath,
        proxiedContract,
    }

    return result;
}
