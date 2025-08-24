import { ethers } from 'ethers';
import { provider } from './network.js';
import { deleteByIndex, seekAccount } from '../utils/accounter.js';

export let allAccounts = [];
export let accounts = [];
export let hdAccounts = [];

export function addAccounts(privKeyArr) {

    if(!privKeyArr){
        throw `You need to add at least one private key. If you have no private key you can create new accounts by 'newAccounts()'! `;
    }

    if(!privKeyArr.length){
        throw `You need to add at least one private key. If you have no private key you can create new accounts by 'newAccounts()'! `;
    }

    const newFrom = allAccounts.length;

    if(typeof privKeyArr == 'string'){
        const newAccount = new ethers.Wallet(privKeyArr, provider);
        allAccounts.push({
            index: allAccounts.length,
            address: newAccount.address,
            privateKey: privKeyArr
        });
        accounts.push({
            index: allAccounts.length - 1,
            address: newAccount.address,
            privateKey: privKeyArr
        });
        console.log(allAccounts[newFrom]);
    }

    if(Array.isArray(privKeyArr)){
        privKeyArr.map(privKey => {
            const newAccount = new ethers.Wallet(privKey, provider);
            allAccounts.push({
                index: allAccounts.length,
                address: newAccount.address,
                privateKey: privKey
            });
            accounts.push({
                index: allAccounts.length - 1,
                address: newAccount.address,
                privateKey: privKey
            });
        });

        console.log(allAccounts.slice(newFrom));
    }

}

export function addHD(phrase, count = 10) {

    const newFrom = accounts.length;
    
    for (let i = 0; i < count; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const newWallet = ethers.Wallet.fromPhrase(phrase, path);
        allAccounts.push({
            index: allAccounts.length,
            address: newWallet.address,
            phrase: phrase
        });
        hdAccounts.push({
            index: allAccounts.length - 1,
            address: newWallet.address,
            phrase: phrase
        });
    }

    console.log(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    console.log(allAccounts.slice(newFrom));

}

export function createAccounts(count = 1) {

    const newAccounts = Array.from({length: count}, () => ethers.Wallet.createRandom());
    const newFrom = accounts.length;

    for(let i = 0; i < newAccounts.length; i++) {

        allAccounts.push({
            index: allAccounts.length,
            address:  newAccounts[i].address,
            privateKey: newAccounts[i].privateKey
        });
        accounts.push({
            index: allAccounts.length - 1,
            address: newAccounts[i].address,
            privateKey: newAccounts[i].privateKey
        })

    }

    console.log(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    console.log(allAccounts.slice(newFrom));

}

export function createHD(count = 10) {

    const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase;
    const newFrom = accounts.length;
    
    for (let i = 0; i < count; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const newWallet = ethers.Wallet.fromPhrase(mnemonic, path);
        allAccounts.push({
            index: allAccounts.length,
            address: newWallet.address,
            phrase: mnemonic
        });
        hdAccounts.push({
            index: allAccounts.length - 1,
            address: newWallet.address,
            phrase: mnemonic
        });
    }

    console.log(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    console.log(allAccounts.slice(newFrom));

}

export function getAllAccounts() {
    
    console.log(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    console.log(allAccounts);

}

export function getAccounts() {
    
    console.log(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    console.log(accounts);

}

export function getHDAccounts() {

    console.log(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    console.log(hdAccounts);

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