/**
 * @fileoverview Ethereum wallet management utilities
 * @description Manages Ethereum wallets including creation, import, and deletion
 * of both regular wallets and HD (Hierarchical Deterministic) wallets. Supports
 * importing private keys, generating new wallets, and connecting to node-managed accounts.
 * @module wallet
 */

import { ethers } from 'ethers';
import { provider } from './config.js';
import { 
    deleteByIndex, 
    deleteByIndexArr, 
    getAccountInfo, 
    detectDupWallet,
    updateWalletJSON,
    getWalletJSON,
    updateAccountMemory,
    setDefaultAccount
 } from '../utils/accounter.js';

/**
 * Array containing all accounts (imported, generated, HD, and node-managed)
 * @type {Array<Object>}
 */
export let allAccounts = getWalletJSON();

/**
 * Array containing only regular accounts (imported and generated)
 * @type {Array<Object>}
 */
export let accounts = [];

/**
 * Array containing only HD (Hierarchical Deterministic) accounts
 * @type {Array<Object>}
 */
export let hdAccounts = [];

// Update accounts & hdAccounts arrays
const { memAccArr, memHDAccArr } = updateAccountMemory(allAccounts);
accounts = memAccArr;
hdAccounts = memHDAccArr;

/**
 * Add accounts from private key(s)
 * @param {string|Array<string>} privKeyArr - Single private key or array of private keys
 * @throws {Error} If no private key is provided
 * @example
 * addAccounts('0x1234...');
 * addAccounts(['0x1234...', '0x5678...']);
 */
export function addAccounts(privKeyArr) {
    if(!privKeyArr){
        throw `You need to add at least one private key. If you have no private key you can create new accounts by 'newAccounts()'! `;
    }

    if(!privKeyArr.length){
        throw `You need to add at least one private key. If you have no private key you can create new accounts by 'newAccounts()'! `;
    }

    let newAccObj;
    const dupWallet = detectDupWallet(privKeyArr);

    if(dupWallet.status) {
        throw `Wallets may NOT be duplicated! You are adding wallet index ${dupWallet.index} again!`
    }

    const newFrom = allAccounts.length;

    if(typeof privKeyArr === 'string'){
        const newAccount = new ethers.Wallet(privKeyArr, provider);
        newAccObj = {
            index: allAccounts.length,
            address: newAccount.address,
            privateKey: privKeyArr,
            type: 'user-imported',
            contracts: []
        }
        allAccounts.push(newAccObj);
        updateWalletJSON(allAccounts);
        newAccObj.index = allAccounts.length - 1;
        accounts.push(newAccObj);
        return allAccounts[newFrom];
    }

    if(Array.isArray(privKeyArr)){
        privKeyArr.map(privKey => {
            const newAccount = new ethers.Wallet(privKey, provider);
            newAccObj = {
                index: allAccounts.length,
                address: newAccount.address,
                privateKey: privKey,
                contracts: []
            }
            allAccounts.push(newAccObj);
            updateWalletJSON(allAccounts);
            newAccObj.index = allAccounts.length - 1;
            accounts.push(newAccObj);
        });

        return allAccounts.slice(newFrom);
    }
    setDefaultAccount(allAccounts[0]);
}

/**
 * Add HD wallets from a mnemonic phrase
 * @param {string} phrase - BIP39 mnemonic phrase
 * @param {number} [count=10] - Number of accounts to derive from the mnemonic
 * @example
 * addHD('witch collapse practice feed shame open despair creek road again ice least', 5);
 */
export function addHD(phrase, count = 10) {
    const newFrom = allAccounts.length;
    let newAccObj;
    const hdNode = ethers.HDNodeWallet.fromPhrase(phrase);

    const existingPhrase = allAccounts.find(wallet => wallet.phrase == phrase);
    if(existingPhrase) {
        throw `Error: HD wallet with this mnemonic phrase already exists at index ${existingPhrase.index}!`
    }
    
    for (let i = 0; i < count; i++) {
        const hdWallet = hdNode.derivePath(i.toString());
        const dupHDWallet = detectDupWallet(hdWallet.privateKey);
        if(dupHDWallet.status) {
            throw `Error: Wallets may NOT be duplicated! You are adding wallet index ${dupHDWallet.index} again!`
        } else {
            newAccObj = {
                index: allAccounts.length,
                address: hdWallet.address,
                phrase: hdWallet.mnemonic.phrase,
                privateKey: hdWallet.privateKey,
                type: 'user-imported',
                path: hdWallet.path,
                depth: hdWallet.depth,
                contracts: []
            },
            allAccounts.push(newAccObj);
            newAccObj.index = allAccounts.length - 1;
            hdAccounts.push(newAccObj);
        }
    }
    updateWalletJSON(allAccounts);
    setDefaultAccount(allAccounts[0]);
    console.info(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    return allAccounts.slice(newFrom);
}

/**
 * Create new random accounts
 * @param {number} [count=1] - Number of accounts to create
 * @example
 * createAccounts(3);
 */
export function createAccounts(count = 1) {
    const newAccounts = Array.from({length: count}, () => ethers.Wallet.createRandom());
    const newFrom = accounts.length;
    let newAccObj;

    for(let i = 0; i < newAccounts.length; i++) {
        newAccObj = {
            index: allAccounts.length,
            address:  newAccounts[i].address,
            privateKey: newAccounts[i].privateKey,
            type: 'user-generated',
            contracts: []
        }
        allAccounts.push(newAccObj);
        newAccObj.index = allAccounts.length - 1;
        accounts.push(newAccObj);

    }
    updateWalletJSON(allAccounts);
    setDefaultAccount(allAccounts[0]);
    console.info(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    return allAccounts.slice(newFrom);
}

/**
 * Create new HD wallet with random mnemonic
 * @param {number} [count=10] - Number of accounts to derive
 * @example
 * createHD(5);
 */
export function createHD(count = 10) {
    const hdNode = ethers.HDNodeWallet.createRandom();
    const newFrom = allAccounts.length;
    let newAccObj;
    
    for (let i = 0; i < count; i++) {
        const hdWallet = hdNode.derivePath(i.toString());
        newAccObj = {
            index: allAccounts.length,
            address: hdWallet.address,
            phrase: hdWallet.mnemonic.phrase,
            privateKey: hdWallet.privateKey,
            type: 'user-generated',
            nonce: 0,
            balance: 0,
            path: hdWallet.path,
            depth: hdWallet.depth,
            contracts: []
        }
        allAccounts.push(newAccObj);
        newAccObj.index = allAccounts.length - 1;
        hdAccounts.push(newAccObj);
    }
    updateWalletJSON(allAccounts);
    setDefaultAccount(allAccounts[0]);
    console.info(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    return allAccounts.slice(newFrom);
}

/**
 * Get all accounts (imported, generated, HD, and node-managed)
 * @example
 * getAllAccounts();
 */
export function getAllAccounts() {
    console.info(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    return allAccounts;
}

/**
 * Get regular accounts (imported and generated only)
 * @example
 * getAccounts();
 */
export function getAccounts() {
    console.info(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    return accounts;
}

/**
 * Get HD accounts only
 * @example
 * getHDAccounts();
 */
export function getHDAccounts() {
    console.info(`!WARNING!\n The generated accounts are NOT safe. Do NOT use them on main net!`);
    return hdAccounts;
}

/**
 * Delete account(s) by various identifiers
 * @param {number|string|Array<number>|null} accPointer - Account index, address, mnemonic phrase, or array of indices
 * @example
 * deleteAccount(0); // Delete by index
 * deleteAccount('0x1234...'); // Delete by address
 * deleteAccount([0, 2, 5]); // Delete multiple by indices
 * deleteAccount('witch collapse...'); // Delete all accounts from mnemonic
 * deleteAccount(); // Delete all accounts
 */
export function deleteAccount(accPointer) {
    if(!accPointer && accPointer !== 0) {
        deleteByIndex(null);
        return allAccounts;
    }

    if(typeof accPointer === 'number') {
        deleteByIndex(accPointer);
        return allAccounts;
    }

    if(ethers.isAddress(accPointer)) {
        const index = allAccounts.findIndex(wallet => wallet.address === accPointer);

        if(index !== -1) {
            deleteByIndex(index);
        }
        return allAccounts;
    }

    if(Array.isArray(accPointer)) {
        deleteByIndexArr(accPointer);
        return allAccounts;
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

        return allAccounts;
        return;
    }
}

/**
 * Connect to node-managed wallets (e.g., from Hardhat node)
 * @async
 * @returns {Promise<void>}
 * @example
 * await connectWallet();
 */
export async function connectWallet() {
    try {
        const addressArr = await provider.listAccounts();
        for (let i = 0; i < addressArr.length; i++) {
            const accSigner = await provider.getSigner(addressArr[i].address);
            allAccounts.push({
                index: allAccounts.length,
                address: addressArr[i].address,
                type: 'node-managed', // Indicate this is managed by the node
                signer: accSigner // Store signer reference
            })
            accounts.push({
                index: allAccounts.length - 1,
                address: addressArr[i].address,
                type: 'node-managed', // Indicate this is managed by the node
                signer: accSigner // Store signer reference
            }) 
        }
        updateWalletJSON(allAccounts);
    } catch(err) {
        console.error(err);
    }
}

/**
 * Get detailed wallet information including balance and nonce
 * @async
 * @param {number|string|Array} accPointer - Account index, address, or array of indices
 * @throws {Error} If input is empty or invalid
 * @example
 * await getWalletInfo(0); // Get info by index
 * await getWalletInfo('0x1234...'); // Get info by address
 * await getWalletInfo([0, 1, 2]); // Get info for multiple accounts
 */
export async function getWalletInfo(accPointer) {
    try {
        if(!accPointer && accPointer != 0) {
            throw new Error('Error: Empty input is NOT valid!');
        }

        if(typeof accPointer === 'number') {
            const index = allAccounts.findIndex(wallet => wallet.index == accPointer);
            return await getAccountInfo(index);
        }

        if(ethers.isAddress(accPointer)) {
            const index = allAccounts.findIndex(wallet => wallet.address == accPointer);
            return await getAccountInfo(index);
        }

        if(Array.isArray(accPointer)) {
            return await getAccountInfo(accPointer);
        }
    
    } catch(err) {
        console.error(err);
    }
}

/**
 * Changes the default account in config file by user
 * @param {number | string} accPointer 
 * @throws {Error} If input is empty or invalid
 */
export function changeDefaultAccount(accPointer) {
    try {
        if(!accPointer && accPointer != 0) {
            throw new Error('Error: Empty input is NOT valid!');
        }

        if(typeof accPointer === 'number') {
            const index = allAccounts.findIndex(wallet => wallet.index == accPointer);
            setDefaultAccount(allAccounts[index]);
        }

        if(ethers.isAddress(accPointer)) {
            const index = allAccounts.findIndex(wallet => wallet.address == accPointer);
            setDefaultAccount(allAccounts[index]);
        }

        if(ethers.isHexString(accPointer, 32)) {
            const dupWallet = detectDupWallet(accPointer);
            if(dupWallet.status) {
                throw `Wallets may NOT be duplicated! You are adding wallet index ${dupWallet.index} again!`
            }
            const newAccount = new ethers.Wallet(accPointer, provider);
            const newAccObj = {
                index: allAccounts.length,
                address: newAccount.address,
                privateKey: accPointer,
                type: 'user-imported',
                contracts: []
            }
            allAccounts.push(newAccObj);
            accounts.push(newAccObj);
            setDefaultAccount(newAccObj);
        }
    
    } catch(err) {
        console.error(err);
    }
}
