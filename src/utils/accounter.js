import { accounts } from '../services/wallet.js';

export function deleteByIndex(index) {

    accounts.splice(index, 1);
    // Update index property of accounts
    for (let i = index; i < accounts.length; i++) {
        accounts[i].index = i;
    }
    console.log(accounts);

}

export function seekAccount(address) {

    for (let i = 0; i < accounts.length; i++) {
        if(accounts[i] == address) {
            return i;
        }
    }

}