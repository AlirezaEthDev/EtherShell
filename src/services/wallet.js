import { ethers } from 'ethers';
import { provider } from './network.js';

export let accounts = [];

export function addAccounts(privKeyArr) {

    if(!privKeyArr){
        throw `You need to add at least one private key. If you have no private key you can create new accounts by 'newAccounts()'! `;
    }

    if(!privKeyArr.length){
        throw `You need to add at least one private key. If you have no private key you can create new accounts by 'newAccounts()'! `;
    }

    if(typeof privKeyArr == 'string'){
        const newAccount = new ethers.Wallet(privKeyArr, provider);
        accounts.push({
            address: newAccount.address,
            privateKey: privKeyArr
        });
        console.log(accounts);
    }

    if(Array.isArray(privKeyArr)){
        privKeyArr.map(privKey => {
            const newAccount = new ethers.Wallet(privKey, provider);
            accounts.push({
                address: newAccount.address,
                privateKey: privKey
            });
        });

        console.log(accounts);
    }

}