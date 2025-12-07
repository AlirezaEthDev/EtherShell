/**
 * @fileoverview Solidity compiler management and contract compilation
 * @description Manages Solidity compiler versions, compilation settings, and
 * provides functions to compile smart contracts with customizable options.
 * @module build
 */

import path from 'path';
import solc from 'solc';
import { check, collectSolFiles } from '../utils/dir.js';
import { 
  setVersion,
  build, 
  loadSolcVersion, 
  extractLoadableVersion 
} from '../utils/builder.js';
import fs from 'fs';

/**
 * Stored config path
 * @type {string}
 */
export const configPath = './localStorage/config.json';

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

// Load config file
if(fs.existsSync(configPath)){
  storedCompConfig = JSON.parse(fs.readFileSync(configPath));
} else {
  storedCompConfig = null;
}

// Initialize global configuration of compiler
if(storedCompConfig){
  configFile.compiler = storedCompConfig.compiler;
  console.info(`Compiler is loading ...`);
  compConfig.currentSolcInstance = await loadSolcVersion(configFile.compiler.version);
  console.info(`Loading done!`);
  compConfig.optimizer = configFile.compiler.optimizer;
  compConfig.viaIR = configFile.compiler.viaIR;
  compConfig.optimizerRuns = configFile.compiler.optimizerRuns;
} else {
  compConfig = {
    currentSolcInstance: solc, // default local compiler
    optimizer: false,
    viaIR: false,
    optimizerRuns: 200
  }
  configFile.compiler.version = extractLoadableVersion(compConfig.currentSolcInstance.version());
  configFile.compiler.optimizer = compConfig.optimizer;
  configFile.compiler.viaIR = compConfig.viaIR;
  configFile.compiler.optimizerRuns = compConfig.optimizerRuns;

  // Update config file
  fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));
}

/**
 * Update the Solidity compiler to a specific version
 * @async
 * @param {string} version - Solidity version (e.g., 'v0.8.20+commit.a1b79de6')
 * @returns {Promise<void>}
 * @throws {Error} If the specified version cannot be loaded
 * @example
 * await updateCompiler('v0.8.20+commit.a1b79de6');
 */
export async function updateCompiler(version){
  try{
    // Update global configuration
    compConfig.currentSolcInstance = await setVersion(version, compConfig.currentSolcInstance);

    // Update config file
    configFile.compiler.version = extractLoadableVersion(compConfig.currentSolcInstance.version());
    fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));
  } catch(err) {
    console.error(err);
  }
}

/**
 * Get the current compiler version
 * @returns {string} Current Solidity compiler version string
 * @example
 * const version = currentCompiler(); // Returns: "0.8.20+commit.a1b79de6.Emscripten.clang"
 */
export function currentCompiler(){
  return compConfig.currentSolcInstance.version();
}

/**
 * Configure compiler optimization options
 * @param {boolean} gasOptimizer - Enable or disable gas optimization
 * @param {boolean} viaIR - Enable or disable IR-based code generation
 * @param {number} [optimizerRuns=200] - Number of times the optimizer should run
 * @returns {Object|null} Updated compiler configuration or null on error
 * @throws {Error} If parameters are invalid
 * @example
 * compilerOptions(true, false, 1000);
 */
export function compilerOptions(gasOptimizer, viaIR, optimizerRuns = 200) {
  try {
    // Validate input parameters
    if (typeof gasOptimizer !== 'boolean') {
        throw new Error('Gas optimizer parameter must be a boolean');
    }
    if (typeof viaIR !== 'boolean') {
        throw new Error('ViaIR parameter must be a boolean');
    }
    if (typeof optimizerRuns !== 'number' || optimizerRuns < 1) {
        throw new Error('Optimizer runs must be a positive number');
    }

    // Update global configuration
    compConfig.optimizer = gasOptimizer;
    compConfig.viaIR = viaIR;
    compConfig.optimizerRuns = optimizerRuns;

    configFile.compiler.optimizer = compConfig.optimizer;
    configFile.compiler.viaIR = compConfig.viaIR;
    configFile.compiler.optimizerRuns = compConfig.optimizerRuns;

    // Update config file
    fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));

    // Provide user feedback
    console.log('✓ Compiler options updated:');
    console.log(`  Gas Optimizer: ${compConfig.optimizer ? 'Enabled' : 'Disabled'}`);
    if (compConfig.optimizer) {
        console.log(`  Optimizer Runs: ${compConfig.optimizerRuns}`);
    }
    console.log(`  ViaIR: ${compConfig.viaIR ? 'Enabled' : 'Disabled'}`);
  } catch (error) {
      console.error('Error setting compiler options:', error.message);
      return null;
  }
}

/**
 * Get current compiler options
 * @returns {Object} Copy of current compiler configuration
 * @example
 * const opts = getCompilerOptions();
 */
export function getCompilerOptions() {
  return { ...compConfig };
}

/**
 * Compile Solidity smart contract(s)
 * @param {string} [fullPath] - Path to contract file or directory. Defaults to './contracts'
 * @param {Array<string>} [selectedContracts] - Array of specific contract names to compile
 * @param {string} [buildPath] - Output directory for compiled artifacts. Defaults to './build'
 * @returns {void}
 * @throws {Error} If no contracts found or compilation fails
 * @example
 * compile(); // Compile all contracts in './contracts'
 * compile('./contracts/MyToken.sol'); // Compile specific file
 * compile('./contracts', ['MyToken'], './output'); // Compile specific contracts to custom path
 */
export function compile(fullPath, selectedContracts, buildPath){
  try{
    // Set default path if buildPath is undefined
    if(!buildPath){
      buildPath = path.resolve('.', 'build');
      [buildPath].forEach(check);
    }

    let fileExt;
    if(!fullPath) {
      fullPath = path.resolve('.', 'contracts');
    } else {
      fileExt = path.extname(fullPath);
    }

    if(!fileExt){
      const solFiles = collectSolFiles(fullPath);
      
      if(!solFiles.length){
        throw 'There is no smart contract in the directory!';
      } else {
        for(let i = 0; i < solFiles.length; i++){
          build(solFiles[i], selectedContracts, buildPath);
        }
        console.log(`Contracts compiled into ${path.resolve(buildPath)}`);
      }
    } else {
      build(fullPath, selectedContracts, buildPath);
      console.log(`Contract compiled into ${path.resolve(buildPath)}`);
    }
  } catch(err){
      console.error(err);
  }
}