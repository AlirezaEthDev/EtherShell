/**
 * @fileoverview Smart contract deployment and management
 * @description Provides functions to deploy new smart contracts and add existing
 * contracts to the EtherShell environment. Manages contract instances and integrates
 * them with the REPL context.
 * @module addContracts
 */

import { ethers } from 'ethers';
import fs from 'fs';
import { provider } from './config.js';
import { allAccounts, accounts, hdAccounts } from './wallet.js';
import { LocalStorage } from 'node-localstorage';
import { r } from '../../bin/cli.js';
import { configFile } from './config.js';
import { createContractProxy } from '../utils/contractProxy.js';

/**
 * Local storage instance for persisting contract metadata
 * @type {LocalStorage}
 */
const localStorage = new LocalStorage('./ethershell');

/**
 * Map of all deployed and added contracts
 * @type {Map<string, ethers.Contract>}
 */
export const contracts = new Map();

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

        // Extend contract object
        deployTx.index = Array.from(contracts.values()).length;
        deployTx.name = contractName;
        deployTx.chain = connectedChain.name;
        deployTx.chainId = connectedChain.chainId;
        deployTx.deployType = 'ethershell-deployed',
        deployTx.provider = currentProvider;

        //////////////////////////////////

        // Create contract proxy
        // Get the contract instance from ethers
        const contractAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        const contractInstance = new ethers.Contract(deployTx.target, contractAbi, wallet);

        // Wrap the contract instace with proxy
        const proxiedContract = createContractProxy(contractInstance, currentProvider, allAccounts);

        proxiedContract.index = Array.from(contracts.values()).length;
        proxiedContract.name = contractName;
        proxiedContract.chain = connectedChain.name;
        proxiedContract.chainId = connectedChain.chainId;
        proxiedContract.deployType = 'ethershell-deployed';
        proxiedContract.provider = currentProvider;

        // Add to REPL context with proxy
        r.context[contractName] = proxiedContract;
        contracts.set(contractName, proxiedContract);

        ////////////////////////////////////////////

        const deployHash = deployTx.deploymentTransaction().hash;
        const tx = await provider.getTransaction(deployHash);
        delete tx.data;

        // Extend transaction object
        tx.ethershellIndex = deployTx.index;
        tx.address = deployTx.target;
        tx.name = deployTx.name;
        tx.chain = deployTx.chain;
        tx.deployType = deployTx.deployType;
        
        console.log(tx);
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

        proxiedContract.index = Array.from(contracts.values()).length;
        proxiedContract.name = contractName;
        proxiedContract.chain = connectedChain.name;
        proxiedContract.chainId = connectedChain.chainId;
        proxiedContract.deployType = 'ethershell-deployed';
        proxiedContract.provider = currentProvider;

        // Add to REPL context with proxy
        r.context[contractName] = proxiedContract;
        contracts.set(contractName, proxiedContract);

        // Update deployer contract list
        const contSpec = {
            address: newContract.target,
            deployedOn: connectedChain.name,
            chainId: connectedChain.chainId
        }

        allAccounts[accIndex].contracts.push(contSpec);

        // Extend contract object
        newContract.index = Array.from(contracts.values()).length;
        newContract.name = contractName;
        newContract.chain = connectedChain.name;
        newContract.chainId = connectedChain.chainId;
        newContract.deployType = 'pre-deployed',
        newContract.provider = currentProvider;

        // Add result
        const result = {
            index: newContract.index,
            name: newContract.name,
            address: newContract.target,
            chain: newContract.chain,
            chainId: newContract.chainId,
            deployType: newContract.deployType,
            provider: newContract.provider
        }

        console.log(result);
    } catch(err) {
        console.error(err);
    }
}
