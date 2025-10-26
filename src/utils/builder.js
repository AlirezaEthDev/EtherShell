/**
 * @fileoverview Solidity compiler builder utilities
 * @description Handles Solidity compiler version loading, contract compilation,
 * and artifact generation including ABIs, bytecode, and metadata.
 * @module builder
 */

import path from 'path';
import fs from 'fs';
import solc from 'solc';
import { check, findImports } from './dir.js';
import { getCompilerOptions } from '../services/build.js';
import { LocalStorage } from 'node-localstorage';

/**
 * Local storage instance for persisting compiler artifacts paths
 * @type {LocalStorage}
 */
const localStorage = new LocalStorage('./localStorage');

/**
 * Load a specific version of the Solidity compiler
 * @param {string} version - Solidity compiler version identifier
 * @returns {Promise<Object>} Promise resolving to solc instance
 * @throws {Error} If version loading fails
 * @example
 * loadSolcVersion('v0.8.20+commit.a1b79de6');
 */
export function loadSolcVersion(version){
  return new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (err, solcInstance) => {
      if (err) reject(err);
      else resolve(solcInstance);
    });
  });
}

/**
 * Set and load a specific Solidity compiler version
 * @async
 * @param {string} version - Solidity compiler version identifier
 * @param {Object} solcInstance - Current solc instance
 * @returns {Promise<Object>} New solc instance with the specified version
 * @throws {Error} If version loading fails
 * @example
 * setVersion('v0.8.20+commit.a1b79de6', solcInstance);
 */
export async function setVersion(version, solcInstance){
  solcInstance = await new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (err, solcSpecificVersion) => {
      if (err) reject(err);
      else resolve(solcSpecificVersion);
    });
  });
  const newVersion = solcInstance.version();
  console.log('Loaded solc version:', newVersion);
  return solcInstance;
}

/**
 * Build (compile) a Solidity contract and save artifacts
 * @param {string} fullPath - Full path to the .sol file
 * @param {Array<string>} [selectedContracts=[]] - Array of contract names to compile from the file
 * @param {string} buildPath - Output directory for compilation artifacts
 * @returns {void}
 * @throws {Error} If compilation fails or produces errors
 * @description Compiles Solidity contracts and saves artifacts in organized subdirectories:
 * - artifacts/: Complete contract data
 * - abis/: Contract ABIs
 * - bytecode/: Contract bytecode
 * - metadata/: Contract metadata
 * @example
 * build('./contracts/MyToken.sol', ['MyToken'], './build');
 */
export function build(fullPath, selectedContracts, buildPath){
  if(!selectedContracts){
    selectedContracts = [];
  }

  const compilerConfig = getCompilerOptions();
  
  // Get the directory containing the contract
  const contractDir = path.dirname(fullPath);
  const filename = path.basename(fullPath, '.sol');
  const source = fs.readFileSync(fullPath, 'utf8');
  
  const input = {
    language: 'Solidity',
    sources: {
      [`${filename}`]: {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    }
  };

  // Apply global compiler configuration
  if (compilerConfig.optimizer) {
    input.settings.optimizer = {
      enabled: true,
      runs: compilerConfig.optimizerRuns
    };
  }
  if (compilerConfig.viaIR) {
    input.settings.viaIR = true;
  }

  // Compile with import callback
  const output = JSON.parse(
    solc.compile(
      JSON.stringify(input),
      { import: (importPath) => findImports(importPath, contractDir) }
    )
  );

  if(output.errors) {
    // Filter out warnings, only throw on actual errors
    const errors = output.errors.filter(err => err.severity === 'error');
    if(errors.length > 0) {
      throw errors;
    }
  }

  // Generate sub-paths of build
  const artifacts = path.join(buildPath, 'artifacts');
  const abis = path.join(buildPath, 'abis');
  const bytecode = path.join(buildPath, 'bytecode');
  const metadata = path.join(buildPath, 'metadata');
  const subPaths = [
      artifacts,
      abis,
      bytecode,
      metadata
  ];

  // Ensure all sub-paths exist
  subPaths.forEach(check);
  const allContracts = Object.keys(output.contracts[`${filename}`]);
  const contractsToSave = selectedContracts.length > 0 ? allContracts.filter(
    (contractName) => {
      return selectedContracts.includes(contractName);
    }
  ): allContracts;
  contractsToSave.forEach((contractName) => {
    const contractsData = output.contracts[`${filename}`][contractName];
    // Save on artifacts
    const artifactsPath = path.join(artifacts, `${contractName}.json`);
    fs.writeFileSync(artifactsPath, JSON.stringify(contractsData, null, 2));
    // Save on abis
    const abisPath = path.join(abis, `${contractName}.abi.json`);
    fs.writeFileSync(abisPath, JSON.stringify(contractsData.abi, null, 2));
    // Save on bytecode
    const bytecodePath = path.join(bytecode, `${contractName}.bin`);
    fs.writeFileSync(bytecodePath, JSON.stringify(contractsData.evm.bytecode, null, 2));
    // Save on metadata
    const metadataPath = path.join(metadata, `${contractName}.metadata.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(contractsData.metadata, null, 2));
    // Store abis and bytecode on local storage
    localStorage.setItem(`${contractName}_abi`, abisPath);
    localStorage.setItem(`${contractName}_bytecode`, bytecodePath);
  });
}

