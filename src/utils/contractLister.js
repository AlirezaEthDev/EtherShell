/**
 * @fileoverview Contract listing utilities
 * @description Provides utilities to retrieve and format contract information
 * from the contracts map, including balance information.
 * @module contractLister
 */

import { contracts } from '../services/addContracts.js';
import { provider } from '../services/configSync.js';
import { updateContractJSON } from './contractStorage.js';

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

    for (const x of contracts) {
        const balance = await provider.getBalance(x.address);

        contractsArray.push({
            index: x.index,
            name: x.name,
            address: x.address,
            chain: x.chain,
            chainId: x.chainId,
            deployType: x.deployType,
            balance,
            abiPath: x.abiPath
        });
    }

    return contractsArray;
}

/**
 * Update contracts array, contracts.json, and index of proxied contract to call on the shell
 * @param {Object} contractRecord - The record of new contract to store
 * @param {Object} proxiedContract - the proxied contract to call on the shell
 * @returns {number} The assigned zero-based registry index.
 * @throws {Error} If serialization or writing the registry fails.
 */
export function appendContract(contractRecord, proxiedContract) {
    // Prepare contract record to store
    const index = contracts.length;
    const contractToStore = {index, ...contractRecord};
    // Checking duplication
    const isDuplicated = detectDupContract(contractToStore.address, contractToStore.chainId);
    if(isDuplicated.status) {
        throw `Contracts may NOT be duplicated! You are adding contract index ${isDuplicated.index} again!`
    }
    // Store new record on contracts array
    contracts.push(contractToStore);
    // Set the index to call contract on the shell
    proxiedContract._contractIndex = index;
    // Store the new array on contracts.json instead the previous array
    updateContractJSON(contracts);
    return index;
}

/**
 * Checks if an added contract deployed/added before or not.
 * @param {string} contractAddr 
 * @param {string} chainId 
 * @returns {Object} 
 */
function detectDupContract(contractAddr, chainId) {
    // Check if contract address is duplicated
    const foundDupContracts = contracts.filter(contract => contract.address == contractAddr);
    if(foundDupContracts) {
        let resultObj = {
            status: false,
            index: 0
        }
        for(let i = 0; i < foundDupContracts.length; i++) {
            // Check if the contract chain ID is duplicated
            if(foundDupContracts[i].chainId == chainId) {
                resultObj.status = true;// Duplicated
                resultObj.index = foundDupContracts[i].index;
                return resultObj;
            }
        }
        return resultObj;
    } else {
        return {
            status: false
        }
    }
}