/**
 * @fileoverview Network provider management for Ethereum connections
 * @description Manages JSON-RPC provider connections to Ethereum networks,
 * allowing users to switch between different networks and retrieve network information.
 * @module network
 */

import { ethers } from 'ethers';
import { LocalStorage } from 'node-localstorage';

/**
 * Local storage instance for persisting compiler artifacts paths
 * @type {LocalStorage}
 */
const localStorage = new LocalStorage('./localStorage');

/**
 * Default JSON-RPC URL for local Ethereum node
 * @constant {string}
 */
const defaultUrl = 'http://127.0.0.1:8545' ;

/**
 * Currently active network URL
 * @type {string}
 */
export let currentUrl;

/**
 * Ethers.js JSON-RPC provider instance
 * @type {ethers.JsonRpcProvider}
 */
export let provider 

// Initialize provider with default URL
/**
 * The specific RPC endpoint URL saved on storage before.
 * @type {string}
 */
const storedUrl = localStorage.getItem('url');
if(storedUrl) {
    provider = new ethers.JsonRpcProvider(storedUrl);;
    currentUrl = storedUrl
} else {
    provider = new ethers.JsonRpcProvider(defaultUrl);
    currentUrl = defaultUrl;
}


/**
 * Set a new network provider
 * @async
 * @param {string} url - The JSON-RPC endpoint URL
 * @returns {Promise<void>}
 * @throws {Error} If connection to the network fails
 * @example
 * await set('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
 */
export async function set(url){
    try{
        provider = new ethers.JsonRpcProvider(url);
        currentUrl = url;
        const result = await provider.getNetwork();
        const network = {
            URL: currentUrl,
            name: result.name,
            chainId: result.chainId
        }    
        localStorage.setItem('url', url);
        console.log(network);
    }catch(err){
        console.error(err);
    }
}

/**
 * Get current network information
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If unable to retrieve network information
 * @example
 * await get(); // Logs: { URL: '...', name: 'mainnet', chainId: 1n }
 */
export async function get(){
    try{
        const result = await provider.getNetwork();
        const network = {
            URL: currentUrl,
            name: result.name,
            chainId: result.chainId
        }    
        console.log(network);
    }catch(err){
        console.error(err);
    }
}

/**
 * Get default network URL
 * @returns {void}
 * @example
 * getDefault(); // Logs: { URL: 'http://127.0.0.1:8545' }
 */
export function getDefault(){
    try{
        const result = {
            URL: defaultUrl
        }
        console.log(result);
    }catch(err){
        console.error(err);
    }
}