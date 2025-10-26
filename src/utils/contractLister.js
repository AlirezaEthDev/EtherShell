/**
 * @fileoverview Contract listing utilities
 * @description Provides utilities to retrieve and format contract information
 * from the contracts map, including balance information.
 * @module contractLister
 */

import { contracts } from '../services/addContracts.js';

/**
 * Get array of all contracts with their information
 * @async
 * @returns {Promise<Array<Object>>} Array of contract information objects
 * @description Retrieves all contracts from the contracts map and formats them
 * into a simplified array with essential information including current balance
 * @example
 * const contractList = await getContArr();
 * // Returns: [{ index: 0, name: 'MyToken', address: '0x...', chain: 'sepolia', ... }]
 */
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