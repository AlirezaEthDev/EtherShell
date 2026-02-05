/**
 * @fileoverview Account management utilities
 * @description Internal utilities for managing account arrays, including deletion
 * and information retrieval. Handles synchronization across multiple account arrays.
 * @module accounter
 */

import { allAccounts, accounts, hdAccounts } from '../services/wallet.js';
import { provider } from '../services/network.js';
import fs from 'fs';
import { configFile, configPath } from '../services/build.js';
import { serializeBigInts } from './serialize.js';

/**
 * The path which in wallets json file will be saved.
 * @type {String}
 */
const walletJSONPath = './ethershell/wallets.json';

/**
 * Delete account(s) by index
 * @param {number|Array<number>|null} index - Account index, array of indices, or null to delete all
 * @returns {void}
 * @example
 * deleteByIndex(0); // Delete account at index 0
 * deleteByIndex([1, 3, 5]); // Delete multiple accounts
 * deleteByIndex(null); // Delete all accounts
 */
export function deleteByIndex(index) {
    if (Array.isArray(index)) {
        deleteByIndexArr(index);
    } else if (typeof index === 'number') {
        _deleteBySingIndex(index);
    } else if (index === null || index === undefined) {
        _deleteAll();
    }
}

/**
 * Delete multiple accounts by array of indices
 * @param {Array<number>} indices - Array of account indices to delete
 * @returns {void}
 * @example
 * deleteByIndexArr([0, 2, 4]);
 */
export function deleteByIndexArr(indices) {
    if (!indices || !indices.length) {
        console.error('Error: Empty input is NOT valid!');
        return;
    }
    
    // Sort indices in descending order to avoid shifting issues
    const sortedIndices = [...indices].sort((a, b) => b - a);
    
    // Delete each index from highest to lowest
    for (const index of sortedIndices) {
        _deleteBySingIndex(index);
    }
}

/**
 * Get account information including balance and nonce
 * @async
 * @param {number|Array<number>} index - Account index or array of indices
 * @returns {Promise<void>}
 * @example
 * await getAccountInfo(0);
 * await getAccountInfo([0, 1, 2]);
 */
export async function getAccountInfo(index) {
    if (Array.isArray(index)) {
        await _getAccArrInfo(index);
    } else if (typeof index === 'number') {
        await _getAccountInfo(index);
    }
}

/**
 * Checks if an imported wallet added before or not.
 * @param {string|Array<string>} privKeyArr - Account private key or array of private keys
 * @returns {Object}
 * @example
 * detectDupWallet('0x12cb...');
 * detectDupWallet(['0x12cb...','0x34cd...', ...]);
 */
export function detectDupWallet(privKeyArr) {
    if(typeof privKeyArr === 'string') {
        return _findDupWalletByKey(privKeyArr);
    }

    if(Array.isArray(privKeyArr)) {
       return  _findDupWalletByArr(privKeyArr);
    }
}

/**
 * Writes/Updates wallets json file
 * @param {Array<string>} walletArr - Account array
 * @example
 * updateWalletJSON([{
            index: allAccounts.length,
            address: newAccount.address,
            privateKey: privKeyArr,
            type: 'user-imported',
            contracts: []
        }]);
 */
export function updateWalletJSON(walletArr) {
    const walletObj = serializeBigInts(walletArr);
    fs.writeFileSync(walletJSONPath, JSON.stringify(walletObj, null, 2));
}

/**
 * Returns wallets' object from saved json file
 * @returns {Object}
 */
export function getWalletJSON() {
    if(fs.existsSync(walletJSONPath)){
        const walletJSON = fs.readFileSync(walletJSONPath, 'utf8');
        // Return empry array if wallet is empty
        if(walletJSON.length === 0) {
            return [];
        } else {
            return JSON.parse(fs.readFileSync(walletJSONPath));
        }
    } else {
        // Generate empty wallet.json if it doesn't exist
        const fd = fs.openSync(walletJSONPath, 'w');
        fs.closeSync(fd);
        return [];
    }
}

export function updateAccountMemory(allAccArr) {
    let memAccArr = [];
    let memHDAccArr = [];
    for(let i = 0; i < allAccArr.length; i++) {
        if(allAccArr[i].phrase) {
            memHDAccArr.push(allAccArr[i])
        } else {
            memAccArr.push(allAccArr[i]);
        }
    }
    return {
        memAccArr,
        memHDAccArr
    }
}

/**
 * Get information for multiple accounts (internal)
 * @private
 * @async
 * @param {Array<number>} _indices - Array of account indices
 * @returns {Promise<void>}
 */
async function _getAccArrInfo(_indices) {
    if (!_indices || !_indices.length) {
        console.error('Error: Empty input is NOT valid!');
        return;
    }

    // Sort indices in descending order to avoid shifting issues
    const sortedIndices = [..._indices].sort((a, b) => b - a);
    
    // Delete each index from highest to lowest
    for (const index of sortedIndices) {
        await _getAccountInfo(index);
    }
}

/**
 * Get information for a single account (internal)
 * @private
 * @async
 * @param {number} _index - Account index
 * @returns {Promise<void>}
 */
async function _getAccountInfo(_index) {
    const accInfo = allAccounts[_index];
    
    accInfo.nonce = await provider.getTransactionCount(accInfo.address);
    accInfo.balance = await provider.getBalance(accInfo.address);

    console.log(accInfo);
}

/**
 * Delete a single account by index (internal implementation)
 * @private
 * @param {number|null} _index - Account index or null to clear all
 * @returns {void}
 */
function _deleteBySingIndex(_index) {

    // Find and remove from allAccounts
    const accountIndex = allAccounts.findIndex(acc => acc.index === _index);
    if (accountIndex !== -1) {
        allAccounts.splice(accountIndex, 1);
        
        // Update indices in allAccounts
        for (let i = accountIndex; i < allAccounts.length; i++) {
            allAccounts[i].index = i;
        }

        // Update wallet json file
        fs.writeFileSync(walletJSONPath, JSON.stringify(allAccounts, null, 2));
        
        // Remove from accounts array if it exists there
        const regularIndex = accounts.findIndex(acc => acc.index === _index);
        if (regularIndex !== -1) {
            accounts.splice(regularIndex, 1);
            // Update indices in accounts
            for (let i = regularIndex; i < accounts.length; i++) {
                accounts[i].index = _index;
                _index++;
            }
        }
        
        // Remove from hdAccounts array if it exists there
        const hdIndex = hdAccounts.findIndex(acc => acc.index === _index);
        if (hdIndex !== -1) {
            hdAccounts.splice(hdIndex, 1);
            // Update indices in hdAccounts
            for (let i = hdIndex; i < hdAccounts.length; i++) {
                hdAccounts[i].index = _index;
                _index++;
            }
        }

        // Remove from config file if it is default wallet
        if(accountIndex == configFile.defaultWallet.index) {
            deleteDefaultAccount();
        }
    }
}

/**
 * Find a duplicated wallet using passed private key
 * @private
 * @param {string} privKey - Account private key
 * @returns {Object}
 */
function _findDupWalletByKey(privKey) {
    const foundWallet = allAccounts.find(wallet => wallet.privateKey == privKey);
    if(foundWallet) {
        return {
            status: true,
            privateKey: privKey,
            index: foundWallet.index
        }
    } else {
        return {
            status: false
        }
    }
}

/**
 * Find a duplicated wallet using passed private key array
 * @private
 * @param {Array<string>} privKeyArr - Account private key array
 * @returns {Object}
 */
function _findDupWalletByArr(privKeyArr) {
        for(let i = 0; i < privKeyArr.length; i++) {
            const foundWallet = allAccounts.find(wallet => wallet.privateKey == privKeyArr[i]);
            if(foundWallet) {
                return {
                    status: true,
                    privateKey: privKeyArr[i],
                    index: foundWallet.index
                }
            }
        }
        return {
            status: false
        }
}

/**
 * Removes all accounts from storage and memory
 * @private
 * @returns {null}
 */
function _deleteAll() {
    allAccounts.splice(0);
    accounts.splice(0);
    hdAccounts.splice(0);
    deleteDefaultAccount();
    fs.writeFileSync(walletJSONPath, JSON.stringify([], null, 2));
    return;
}

/**
 * Updates default account in config file
 * @param {Object} account - // The given account to set as default account
 */
export function setDefaultAccount(account) {
    configFile.defaultWallet = serializeBigInts(account);
    fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));
}

/**
 * Deletes default account from config file
 */
export function deleteDefaultAccount() {
    configFile.defaultWallet = {};
    fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));
}
