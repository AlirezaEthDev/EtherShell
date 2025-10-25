import { ethers } from 'ethers';
import fs from 'fs';
import { provider } from './network.js';
import { allAccounts } from './wallet.js';
import { LocalStorage } from 'node-localstorage';
import { r } from '../../bin/cli.js';

const localStorage = new LocalStorage('./localStorage');

export const contracts = new Map();

export async function deploy(contractName, args, accIndex, chain, abiLoc, bytecodeLoc) {

    try {

        let currentProvider;
        let connectedChain;

        if(!contractName) {
            throw new Error('Contract name is empty');
        }

        const contractArgs = args || [];

        if(accIndex > allAccounts.length - 1) {
            throw new Error('Wallet index is out of range');
        }

        if(!accIndex) {
            accIndex = 0;
        }

        if(chain) {
            currentProvider = new ethers.JsonRpcProvider(chain);
        } else {
            currentProvider = provider;
        }

        let wallet = new ethers.Wallet(allAccounts[accIndex].privateKey, currentProvider);
        connectedChain = await currentProvider.getNetwork();

        const abiPath = abiLoc || localStorage.getItem(`${contractName}_abi`);
        const bytecodePath = bytecodeLoc || localStorage.getItem(`${contractName}_bytecode`);

        const abi  = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        const bytecode = JSON.parse(fs.readFileSync(bytecodePath, 'utf8'));

        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        const deployTx = await factory.deploy(...contractArgs);
        await deployTx.waitForDeployment();

        // Extend contract object
        deployTx.index = Array.from(contracts.values()).length;
        deployTx.name = contractName;
        deployTx.chain = connectedChain.name;
        deployTx.chainId = connectedChain.chainId;
        deployTx.deployType = 'ethershell-deployed',
        deployTx.provider = currentProvider;

        // Add to contract list
        contracts.set(contractName, deployTx);

        // Add to REPL context
        r.context[contractName] = deployTx;

        const deployHash = deployTx.deploymentTransaction().hash;
        const tx = await provider.getTransaction(deployHash);
        delete tx.data;
        console.log(tx);

    } catch(err) {
        console.error(err);
    }

}

export async function add(contractName, contractAddr, accIndex, abiLoc, chain) {

    try {

        let currentProvider;
        let connectedChain;

        if(!contractAddr) {
            throw new Error('Contract address may not be null or undefined!');
        }

        if(!accIndex) {
            accIndex = 0;
        }

        if(chain) {
            currentProvider = new ethers.JsonRpcProvider(chain);
        } else {
            currentProvider = provider;
        }

        let wallet = new ethers.Wallet(allAccounts[accIndex].privateKey, currentProvider);
        connectedChain = await currentProvider.getNetwork();

        if(!abiLoc) {
            throw new Error('ABI path may not be null or undefined!');
        }

        const abi  = JSON.parse(fs.readFileSync(abiLoc, 'utf8'));

        const newContract = new ethers.Contract(contractAddr, abi, wallet);

        // Extend contract object
        newContract.index = Array.from(contracts.values()).length;
        newContract.name = contractName;
        newContract.chain = connectedChain.name;
        newContract.chainId = connectedChain.chainId;
        newContract.deployType = 'pre-deployed',
        newContract.provider = currentProvider;

        // Add to contract list
        contracts.set(contractName, newContract);

        // Add to REPL context
        r.context[contractName] = newContract;

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
