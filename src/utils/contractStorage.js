import fs from 'fs';
import { serializeBigInts } from './serialize.js';

/**
 * The path which in contracts json file will be saved.
 * @type {String}
 */
export const contractsJSONPath = './ethershell/contracts.json';

/**
 * The path which in deployer wallets and their deployed contracts will be saved
 * @type {String}
 */
export const w2CJSONPath = './ethershell/wallet2contract.json';

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
    fs.writeFileSync(contractsJSONPath, JSON.stringify(contractObj, null, 2));
}

/**
 * Returns pre-added/deployed contracts' objects from saved json file
 * @returns {Object}
 */
export function getContractJSON() {
    return returnArrJSON(contractsJSONPath);
}

/**
 * Returns deployer wallets and their deployed contracts from wallet2contract.json
 * @returns {Object}
 */
export function getW2CJSON() {
    if (!fs.existsSync(w2CJSONPath)) {
        fs.writeFileSync(w2CJSONPath, '{}');
        return {};
    }
    const w2cJSON = fs.readFileSync(w2CJSONPath, 'utf8');
    // Treat an empty/whitespace-only file as an empty object
    if (w2cJSON.trim().length === 0) {
        fs.writeFileSync(w2CJSONPath, '{}');
        return {};
    }
    return JSON.parse(w2cJSON);
}

/**
 * Generates empty array json at the given path if it doesn't exist there, returns array json from the path if it exists!
 * @param {String} path 
 * @returns {Array}
 */
export function returnArrJSON(path) {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, '[]');
        return [];
    }
    const contractJSON = fs.readFileSync(path, 'utf8');
    // Treat an empty/whitespace-only file as an empty array
    if (contractJSON.trim().length === 0) {
        fs.writeFileSync(path, '[]');
        return [];
    }
    return JSON.parse(contractJSON);
}