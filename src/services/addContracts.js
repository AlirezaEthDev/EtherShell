import { ethers } from 'ethers';
import fs from 'fs';
import { provider } from './network.js';
import { allAccounts } from './wallet.js';
import { LocalStorage } from 'node-localstorage';

const localStorage = new LocalStorage('./localStorage');

export let contracts = [];

export function deploy(contractName, args, accIndex, chain, abiLoc, bytecodeLoc) {

    try {

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

        let wallet = new ethers.Wallet(allAccounts[accIndex].privateKey, provider);

        if(chain) {
            provider = new ethers.JsonRpcProvider(chain);
            wallet = wallet.connect(provider);
        }

        const abiPath = abiLoc || localStorage.getItem(`${contractName}_abi`);
        const bytecodePath = bytecodeLoc || localStorage.getItem(`${contractName}_bytecode`);

        const abi  = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        const bytecode = JSON.parse(fs.readFileSync(bytecodePath, 'utf8'));

        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        factory.deploy(...contractArgs).then((deployTx) => {
            deployTx.waitForDeployment().then((result) => {
                contracts.push(result);
                console.log(result);
            })
        })

    } catch(err) {
        console.error(err);
    }

}

export function addContract(contractAddr, accIndex, chain, abiLoc) {

    try {

        if(!contractAddr) {
            throw new Error('Contract address may not be null or undefined!');
        }

        if(!accIndex) {
            accIndex = 0;
        }

        if(chain) {
            provider = new ethers.JsonRpcProvider(chain);
            wallet = wallet.connect(provider);
        }

        const abiPath = abiLoc || localStorage.getItem(`${contractName}_abi`);

        const newContract = new ethers.Contract(contractAddr, abiPath, wallet);

        contracts.push(newContract);
        

    } catch(err) {
        console.error(err);
    }

}
