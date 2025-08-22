import { ethers } from 'ethers';
import { provider } from './network.js';
import { deleteByIndex, seekAccount } from '../utils/accounter.js';

export let accounts = [];

export function addAccounts(privKeyArr) {

    if(!privKeyArr){
        throw `You need to add at least one private key. If you have no private key you can create new accounts by 'newAccounts()'! `;
    }

    if(!privKeyArr.length){
        throw `You need to add at least one private key. If you have no private key you can create new accounts by 'newAccounts()'! `;
    }

    const newFrom = accounts.length;

    if(typeof privKeyArr == 'string'){
        const newAccount = new ethers.Wallet(privKeyArr, provider);
        accounts.push({
            index: accounts.length,
            address: newAccount.address,
            privateKey: privKeyArr
        });
        console.log(accounts[newFrom]);
    }

    if(Array.isArray(privKeyArr)){
        privKeyArr.map(privKey => {
            const newAccount = new ethers.Wallet(privKey, provider);
            accounts.push({
                index: accounts.length,
                address: newAccount.address,
                privateKey: privKey
            });
        });

        console.log(accounts.slice(newFrom));
    }

}

export function createAccounts(count) {

    if(!count) {
        count = 1;
    }

    const newAccounts = Array.from({length: count}, () => ethers.Wallet.createRandom());
    const newFrom = accounts.length;

    for(let i = 0; i < newAccounts.length; i++) {

        accounts.push({
            index: accounts.length,
            address: newAccounts[i].address,
            privateKey: newAccounts[i].privateKey
        })

    }

    console.log(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    console.log(accounts.slice(newFrom));

}

export function deleteAccount(accPointer) {

    if(!accPointer) {

        deleteByIndex(null);

    }

    if(typeof accPointer == 'number') {

        deleteByIndex(accPointer);

    }

    if(ethers.isAddress(accPointer)) {

        const index = seekAccount(accPointer);
        deleteByIndex(index);

    }

}

export function getAccounts() {

    console.log(accounts);

}