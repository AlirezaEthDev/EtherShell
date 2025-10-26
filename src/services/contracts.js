/**
 * @fileoverview Contract retrieval and management
 * @description Provides functions to retrieve contract information from the
 * contract registry by various identifiers (index, address, or name).
 * @module contracts
 */

import { ethers } from 'ethers';
import { getContArr } from '../utils/contractLister.js';

/**
 * Get contract(s) information
 * @async
 * @param {number|string|null} [contPointer] - Contract identifier (index, address, or name).
 *                                              If omitted, returns all contracts.
 * @returns {Promise<void>}
 * @throws {Error} If the input is not valid
 * @example
 * await getContracts(); // Get all contracts
 * await getContracts(0); // Get contract by index
 * await getContracts('0x1234...'); // Get contract by address
 * await getContracts('MyToken'); // Get contract by name
 */
export async function getContracts(contPointer) {
    const contArray = await getContArr();
    let result;

    if(!contPointer && contPointer != 0) {
        result = contArray;
    } else if(typeof contPointer === 'number') {
        result = contArray[contPointer];
    } else if(ethers.isAddress(contPointer)) {
        const index = contArray.findIndex(contract => contract.address == contPointer);
        result = contArray[index];
    } else if(typeof contPointer === 'string') {
        const index = contArray.findIndex(contract => contract.name == contPointer);
        result = contArray[index];
    } else {
        throw new Error('Input is NOT valid!');
    }

    console.log(result);
}
