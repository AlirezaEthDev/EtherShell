import { configFile } from './build.js';

/**
 * Gets all fields of config file
 */
export function getConfigInfo() {
    console.log(configFile); 
}

/**
 * Gets just default account of config file
 */
export function getDefaultAccount() {
    console.log(configFile.defaultWallet);
}