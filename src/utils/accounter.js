import { allAccounts, accounts, hdAccounts } from '../services/wallet.js';

export function deleteByIndex(index) {

    if(!index && index != 0) {
        allAccounts.splice(0, allAccounts.length);
        accounts.splice(0, accounts.length);
        hdAccounts.splice(0, hdAccounts.length);
        console.log(allAccounts);
    } else {

        // Update all list
        const allExists = allAccounts.some(allWallet => allWallet.index === index);
        if(allExists) {
            allAccounts.splice(index, 1);

            // Update index property of accounts
            for (let i = index; i < allAccounts.length; i++) {
                allAccounts[i].index = i;
            }
        }

        // Update personal list
        const exists = accounts.some(wallet => wallet.index === index);
        if(exists) {
            const accIndex = accounts.findIndex(wallet => wallet.index === index);
            accounts.splice(accIndex, 1);
            for (let i = accIndex; i < accounts.length; i++) {
                accounts[i].index = index;
                index++;
            }
        }

        // Update HD list
        const hdExists = hdAccounts.some(hdWallet => hdWallet.index === index);
        if(hdExists) {
            const hdIndex = hdAccounts.findIndex(hdWallet => hdWallet.index === index);
            hdAccounts.splice(hdIndex, 1);
            for (let i = hdIndex; i < hdAccounts.length; i++) {
                hdAccounts[i].index = index;
                index++;
            }
        }

        console.log(allAccounts);
    }

}

export function seekAccount(address) {

    for (let i = 0; i < allAccounts.length; i++) {
        if(allAccounts[i].address == address) {
            return i;
        }
    }

}