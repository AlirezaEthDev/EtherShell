import { ethers } from 'ethers';
import { provider } from './network.js';
import { deleteByIndex, deleteByIndexArr } from '../utils/accounter.js';

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

    const newFrom = allAccounts.length;
    const hdNode = ethers.HDNodeWallet.fromPhrase(phrase);
    
    for (let i = 0; i < count; i++) {
        const hdWallet = hdNode.derivePath(i.toString());
        allAccounts.push({
            index: allAccounts.length,
            address: hdWallet.address,
            phrase: hdWallet.mnemonic.phrase,
            privateKey: hdWallet.privateKey,
            path: hdWallet.path,
            depth: hdWallet.depth
        });
        hdAccounts.push({
            index: allAccounts.length - 1,
            address: hdWallet.address,
            phrase: hdWallet.mnemonic.phrase,
            privateKey: hdWallet.privateKey,
            path: hdWallet.path,
            depth: hdWallet.depth
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

    const hdNode = ethers.HDNodeWallet.createRandom();
    const newFrom = allAccounts.length;
    
    for (let i = 0; i < count; i++) {
        const hdWallet = hdNode.derivePath(i.toString());
        allAccounts.push({
            index: allAccounts.length,
            address: hdWallet.address,
            phrase: hdWallet.mnemonic.phrase,
            privateKey: hdWallet.privateKey,
            path: hdWallet.path,
            depth: hdWallet.depth
        });
        hdAccounts.push({
            index: allAccounts.length - 1,
            address: hdWallet.address,
            phrase: hdWallet.mnemonic.phrase,
            privateKey: hdWallet.privateKey,
            path: hdWallet.path,
            depth: hdWallet.depth
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
        console.log(allAccounts);

    }

    if(typeof accPointer == 'number') {

        deleteByIndex(accPointer);
        console.log(allAccounts);

    }

    if(ethers.isAddress(accPointer)) {

        const index = allAccounts.findIndex(wallet => wallet.address === accPointer);

        if(index !== -1) {
            deleteByIndex(index);
        }
        console.log(allAccounts);

    }

    if(Array.isArray(accPointer)) {
        deleteByIndexArr(accPointer);
    }

    if(ethers.Mnemonic.isValidMnemonic(accPointer)) {

        // Find which accounts to be deleted
        const indicesToDelete = [];
            
        for(let i = 0; i < allAccounts.length; i++) {
            if(allAccounts[i].phrase === accPointer) {
                indicesToDelete.push(allAccounts[i].index);
            }
        }

        // Sort in descending order and delete from highest to lowest
        indicesToDelete.sort((a, b) => b - a);

        // Delete accounts
        for(let i = 0; i < indicesToDelete.length; i++) {
            deleteByIndex(indicesToDelete[i]);
        }

        // deleteByIndexArr(indicesToDelete);

        console.log(allAccounts);
        return;
    }

}
