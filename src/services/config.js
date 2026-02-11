import { 
    loadSolcVersion, 
    extractLoadableVersion 
} from '../utils/builder.js';
import { allAccounts } from './wallet.js';
import { serializeBigInts } from '../utils/serialize.js';
import fs from 'fs';
import { ethers } from 'ethers';

// Sync Config Memory with Storage Config:
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

/**
 * Stored config path
 * @type {string}
 */
export const configPath = './ethershell/config.json';

/**
 * Global compiler configuration state
 * @type {Object}
 * @property {Object} currentSolcInstance - Current Solidity compiler instance
 * @property {boolean} optimizer - Whether gas optimizer is enabled
 * @property {number} optimizerRuns - Number of optimizer runs
 * @property {boolean} viaIR - Whether to use IR-based code generation
 */
let compConfig = {};

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
let configObj;

// 1) Load config file
if(!fs.existsSync(configPath)){
  storedCompConfig = null;
} else {
    configObj = JSON.parse(fs.readFileSync(configPath));
    storedCompConfig = configObj;
}

// 2) Set Provider to Memory:
// Initialize provider with default URL
/**
 * The specific RPC endpoint URL saved on storage before.
 * @type {string}
 */
const storedUrl = configObj.providerEndpoint;
if(storedUrl) {
    provider = new ethers.JsonRpcProvider(storedUrl);
    currentUrl = storedUrl;
    configFile.providerEndpoint = storedUrl;
} else {
    provider = new ethers.JsonRpcProvider(defaultUrl);
    currentUrl = defaultUrl;
    configFile.providerEndpoint = defaultUrl;
}

// 3) Set Compiler to Memeory:
// Initialize global configuration of compiler
if(storedCompConfig){
  configFile.compiler = storedCompConfig.compiler;
  console.info(`Compiler is loading ...`);
  compConfig.currentSolcInstance = await loadSolcVersion(configFile.compiler.version);
  console.info(`Loading done!`);
  compConfig.optimizer = configFile.compiler.optimizer;
  compConfig.viaIR = configFile.compiler.viaIR;
  compConfig.optimizerRuns = configFile.compiler.optimizerRuns;
  compConfig.compilePath = configFile.compiler.compilePath;
} else {
  compConfig = {
    currentSolcInstance: solc, // default local compiler
    optimizer: false,
    viaIR: false,
    optimizerRuns: 200,
    compilePath: './build'
  }
  configFile.compiler.version = extractLoadableVersion(compConfig.currentSolcInstance.version());
  configFile.compiler.optimizer = compConfig.optimizer;
  configFile.compiler.viaIR = compConfig.viaIR;
  configFile.compiler.optimizerRuns = compConfig.optimizerRuns;
  configFile.compiler.compilePath = compConfig.compilePath;
}

// 4) Set Default Account:
// Set the default account from stored wallets
const defWallet = configObj.defaultWallet;
if(defWallet.address) {
    configFile.defaultWallet = serializeBigInts(defWallet);
} else {
    if(allAccounts && allAccounts.length > 0) {
        configFile.defaultWallet = serializeBigInts(allAccounts[0]);
    }
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
    console.log(configFile); 
}

/**
 * Gets just default account of config file
 */
export function getDefaultAccount() {
    console.log(configFile.defaultWallet);
}