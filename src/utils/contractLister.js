/**
 * @fileoverview Contract listing utilities
 * @description Provides utilities to retrieve and format contract information
 * from the contracts map, including balance information.
 * @module contractLister
 */

import { contracts } from '../services/addContracts.js';
import fs from 'fs';
import { serializeBigInts } from './serialize.js'
import { provider } from '../services/configSync.js';

/**
 * 
 */
const contractJSONPath = './ethershell/contracts.json';

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
 * Writes/Updates contracts json file
 * @param {Array<string>} contractArr - Contract array
 * @example
 * updateContractJSON([{
                ...
        }]);
 */
export function updateContractJSON(contractArr) {
    const contractObj = serializeBigInts(contractArr);
    fs.writeFileSync(contractJSONPath, JSON.stringify(contractObj, null, 2));
}

/**
 * Returns pre-added/deployed contracts' objects from saved json file
 * @returns {Object}
 */
export function getContractJSON(){
    if(fs.existsSync(contractJSONPath)){
        const contractJSON = fs.readFileSync(contractJSONPath, 'utf8');
        // Return empty array if contratcs.json is empty
        if(contractJSON.length === 0) {
            return [];
        } else {
            return JSON.parse(fs.readFileSync(contractJSONPath));
        }
    } else {
        // Generate empty contracts.json if it doesn't exist
        const fd = fs.openSync(contractJSONPath, 'w');
        fs.closeSync(fd);
        return [];
    }
}