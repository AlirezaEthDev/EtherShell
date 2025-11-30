/**
 * @fileoverview Account management utilities
 * @description Internal utilities for managing account arrays, including deletion
 * and information retrieval. Handles synchronization across multiple account arrays.
 * @module accounter
 */

import { allAccounts, accounts, hdAccounts } from '../services/wallet.js';
import { provider } from '../services/network.js';

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

export function detectDupWallet(privKeyArr) {
    if(typeof privKeyArr === 'string') {
        return _findDupWalletByKey(privKeyArr);
    }

    if(Array.isArray(privKeyArr)) {
       return  _findDupWalletByArr(privKeyArr);
    }
}

export function detectDupHDWallet(phrase) {
    const foundWallet = allAccounts.find(wallet => wallet.phrase == phrase);
    if(foundWallet) {
        return {
            status: true,
            walletPhrase: phrase,
            index: foundWallet.index
        }
    } else {
        return {
            status: false
        }
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
    if (_index === null || _index === undefined) {
        // Clear all arrays
        allAccounts.splice(0);
        accounts.splice(0);
        hdAccounts.splice(0);
        return;
    }

    // Find and remove from allAccounts
    const accountIndex = allAccounts.findIndex(acc => acc.index === _index);
    if (accountIndex !== -1) {
        allAccounts.splice(accountIndex, 1);
        
        // Update indices in allAccounts
        for (let i = accountIndex; i < allAccounts.length; i++) {
            allAccounts[i].index = i;
        }
        
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
    }
}

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