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
    updateContractJSON,
    getContractJSON
} from '../utils/contractLister.js';

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
 * Instantiate stored contracts to interact with the shell
 */
export async function restore() {
    if(contracts) {
        console.info(`Stored contracts instantiating ...`);
        const contractsLength = contracts.length;
        for(let i = 0; i < contractsLength; i++) {
            await _add(
                contracts[i].name,
                contracts[i].address,
                configFile.defaultWallet.index,
                contracts[i].abiPath
            );
        }
        console.info(`All stored contracts instantiated!`);
    } else {
        return `The storage is empty!`;
    }
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
        deployTx._contractIndex = contracts.length;
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

        proxiedContract._contractIndex = contracts.length;
        proxiedContract._contractName = contractName;
        proxiedContract._contractChain = connectedChain.name;
        proxiedContract._contractChainId = connectedChain.chainId;
        proxiedContract._contractDeployType = 'ethershell-deployed';
        proxiedContract._contractProvider = currentProvider;
        proxiedContract._contractABIPath = abiPath;

        // Add to REPL context with proxy
        r.context[contractName] = proxiedContract;

        const contracToStore = {
            index: proxiedContract._contractIndex,
            name: proxiedContract._contractName,
            address: proxiedContract.target,
            chain: proxiedContract._contractChain,
            chainId: proxiedContract._contractChainId,
            deployType: proxiedContract._contractDeployType,
            balance: await proxiedContract.provider.getBalance(proxiedContract.target),
            abiPath: proxiedContract._contractABIPath
        }
        contracts.push(contracToStore);

        // Update contracts.json
        updateContractJSON(contracts);

        ////////////////////////////////////////////

        const deployHash = deployTx.deploymentTransaction().hash;
        const tx = await provider.getTransaction(deployHash);
        delete tx.data;

        // Get event values
        const tx1 = await provider.getTransactionReceipt(deployHash);
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
        
        // Decorate contract object
        const contracToStore = {
            index: result.index,
            name: result.name,
            address: result.address,
            chain: result.chain,
            chainId: result.chainId,
            deployType: result.deployType,
            balance: await result.provider.getBalance(result.address),
            abiPath: abiLoc
        }
        // Update contracts array
        contracts.push(contracToStore);

        // Update contracts.json
        updateContractJSON(contracts);

        return result;
    } catch(err) {
        console.error(err);
    }
}

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
    newContract._contractIndex = contracts.length + 1;
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
        provider: newContract._contractProvider
    }

    return result;
}
