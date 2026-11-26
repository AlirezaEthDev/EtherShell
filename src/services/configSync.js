import { extractLoadableVersion } from '../utils/builder.js';
import { allAccounts } from './wallet.js';
import { serializeBigInts } from '../utils/serialize.js';
import fs from 'fs';
import { ethers } from 'ethers';
import solc from 'solc';

// Sync Config Memory with Storage Config:
/**
 * Default JSON-RPC URL for local Ethereum node
 * @constant {string}
 */
export const defaultUrl = 'http://127.0.0.1:8545' ;

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

/**
 * Stored config path
 * @type {string}
 */
export const configPath = './ethershell/config.json';

/**
 * Global compiler configuration state
 * @type {Object}
 * @property {boolean} optimizer - Whether gas optimizer is enabled
 * @property {number} optimizerRuns - Number of optimizer runs
 * @property {boolean} viaIR - Whether to use IR-based code generation
 */
export let compConfig = {};

/**
 * JSON file fields of compiler configuration
 * @type {Object}
 * @property {string} version - Current Solidity compiler version
 * @property {boolean} optimizer - Whether gas optimizer is enabled
 * @property {number} optimizerRuns - Number of optimizer runs
 * @property {boolean} viaIR - Whether to use IR-based code generation
 */
export let configFile = { 
    providerEndpoint: '',
    defaultWallet: {},
    compiler: {} 
  };

/**
 * Global compiler configuration state
 * @type {Object}
 * @property {boolean} optimizer - Whether gas optimizer is enabled
 * @property {number} optimizerRuns - Number of optimizer runs
 * @property {boolean} viaIR - Whether to use IR-based code generation
 */
let storedCompConfig;

/**
 * Object containing properties of config file
 * @type {Object}
 */
let configObj = {
        providerEndpoint: "http://127.0.0.1:8545",
        defaultWallet: {},
        compiler: {
            version: "v0.8.29+commit.ab55807c",
            optimizer: false,
            viaIR: false,
            optimizerRuns: 200,
            compilePath: "./build"
        }
    }

// 1) Load config file
/**
 * The specific RPC endpoint URL saved on storage before.
 * @type {string}
 */
let storedUrl;
if(!fs.existsSync(configPath)){
  storedCompConfig = null;
  storedUrl = null;
} else {
    configObj = JSON.parse(fs.readFileSync(configPath));
    storedCompConfig = configObj;
    storedUrl = configObj.providerEndpoint;
}

// 2) Set Provider to Memory:
// Initialize provider with default URL
if(storedUrl) {
    provider = new ethers.JsonRpcProvider(storedUrl);
    currentUrl = storedUrl;
    configFile.providerEndpoint = storedUrl;
} else {
    provider = new ethers.JsonRpcProvider(defaultUrl);
    currentUrl = defaultUrl;
    configFile.providerEndpoint = defaultUrl;
}

// 3) Compiler settings (compilers load lazily when a build needs them)
const stored = storedCompConfig?.compiler ?? {};
const defaultVersion = stored.version ?? extractLoadableVersion(solc.version());
configFile.compiler = {
  version: defaultVersion,
  versions: stored.versions ?? [defaultVersion],
  overrides: stored.overrides ?? {},
  evmVersion: stored.evmVersion ?? null,   // null = compiler default
  optimizer: stored.optimizer ?? false,
  viaIR: stored.viaIR ?? false,
  optimizerRuns: stored.optimizerRuns ?? 200,
  compilePath: stored.compilePath ?? './build'
};
Object.assign(compConfig, {
  optimizer: configFile.compiler.optimizer,
  viaIR: configFile.compiler.viaIR,
  optimizerRuns: configFile.compiler.optimizerRuns,
  compilePath: configFile.compiler.compilePath
});


// 4) Set Default Account:
if(allAccounts && allAccounts.length > 0) {
    // Set the default account from stored wallets
    const defWallet = configObj.defaultWallet;
    if(defWallet.address) {
        configFile.defaultWallet = serializeBigInts(defWallet);
    } else {
        configFile.defaultWallet = serializeBigInts(allAccounts[0]);
    }
} else {
    configFile.defaultWallet = {};
}


// 5) Update config file
fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));

/**
 * Changes provider just in memory
 * @param {Object} newProvider 
 */
export function setProvider(newProvider) {
    provider = new ethers.JsonRpcProvider(newProvider);
}

/**
 * Changes provider just in memory
 * @param {String} newUrl 
 */
export function setCurrentUrl(newUrl) {
    currentUrl = newUrl;
}

/**
 * Changes configFile in memory
 * @param {Object} newConfig 
 */
export function setConfigFile(newConfig) {
    configFile = newConfig;
}

/**
 * Gets all fields of config file
 */
export function getConfigInfo() {
    return configFile; 
}

/**
 * Gets just default account of config file
 */
export function getDefaultAccount() {
    return configFile.defaultWallet;
}