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
        factory.deploy(...contractArgs).then((deployTx) => {
            deployTx.waitForDeployment().then((result) => {
                // Extend contract object
                result.index = Array.from(contracts.values()).length;
                result.name = contractName;
                result.chain = connectedChain.name;
                result.chainId = connectedChain.chainId;
                result.deployType = 'ethershell-deployed',
                result.provider = currentProvider;

                // Add to contract list
                contracts.set(contractName, result);

                // Add to REPL context
                r.context[contractName] = result;

                console.log(result);
            })
        })

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

        console.log(newContract);

    } catch(err) {
        console.error(err);
    }

}
