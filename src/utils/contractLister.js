import { contracts } from '../services/addContracts.js';

export async function getContArr() {
    let contractsArray = [];

    for (const x of contracts.values()) {
        let contract = {
            index: x.index,
            name: x.name,
            address: x.target,
            chain: x.chain,
            chainId: x.chainId,
            deployType: x.deployType,
            balance: await x.provider.getBalance(x.target)
        }
        contractsArray.push(contract);
    }

    return contractsArray;
}