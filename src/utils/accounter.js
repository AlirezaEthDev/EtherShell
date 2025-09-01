import { allAccounts, accounts, hdAccounts } from '../services/wallet.js';

export function deleteByIndex(index) {
    if (Array.isArray(index)) {
        deleteByIndexArr(index);
    } else if (typeof index === 'number') {
        _deleteBySingIndex(index);
    }
}

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

// }