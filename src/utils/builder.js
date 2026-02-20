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
const localStorage = new LocalStorage('./ethershell');

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
  // const source = fs.readFileSync(fullPath, 'utf8');

  // Start collecting from the main contract
  let allSources = {}
  _collectSources(fullPath, allSources);
  
  const input = {
    language: 'Solidity',
    sources: allSources,
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

  // Compile without import callback
  const output = JSON.parse(
    solc.compile(JSON.stringify(input))
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
  const standardJsonDir = path.join(buildPath, 'standard-json');
  const subPaths = [
      artifacts,
      abis,
      bytecode,
      metadata,
      standardJsonDir
  ];
  subPaths.forEach(check);

  // Save standard JSON input on standard-json
  const jsonInputPath = path.join(standardJsonDir, `${filename}.standard.json`);
  fs.writeFileSync(jsonInputPath, JSON.stringify(input, null, 2));

  // Determine the correct key for the main contract in the output
  const mainContractPath = path.relative(path.resolve('.'), path.resolve(fullPath)).split(path.sep).join('/');;
  const contractsInFile = output.contracts[mainContractPath];

  if (!contractsInFile) {
    throw new Error(`Could not find compiled output for ${mainContractPath}`);
  }

  // Ensure all sub-paths exist
  subPaths.forEach(check);
  const allContracts = Object.keys(contractsInFile);
  const contractsToSave = selectedContracts.length > 0 ? allContracts.filter(
    (contractName) => {
      return selectedContracts.includes(contractName);
    }
  ): allContracts;
  const resultAbis = {}; // Collect ABIs to return
  contractsToSave.forEach((contractName) => {
    const contractsData = contractsInFile[contractName];
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

    // Save ABI
    const abi = contractsData.abi || [];
    // Collect ABI in memory
    resultAbis[contractName] = abi;
  });

  // Return map of contractName -> abi
  return resultAbis;
}

/**
 * Extract loadable version format from full version string
 * @param {string} fullVersion - Full version string (e.g., "0.8.20+commit.a1b79de6.Emscripten.clang")
 * @returns {string} Loadable version format (e.g., "v0.8.20+commit.a1b79de6")
 * @example
 * extractLoadableVersion("0.8.20+commit.a1b79de6.Emscripten.clang"); // Returns: "v0.8.20+commit.a1b79de6"
 */
export function extractLoadableVersion(fullVersion) {
  // Match version number and commit hash from full version string
  const match = fullVersion.match(/(\d+\.\d+\.\d+)\+commit\.([a-f0-9]+)/);
  if (!match) {
    throw new Error(`Unable to extract version from: ${fullVersion}`);
  }
  return `v${match[1]}+commit.${match[2]}`;
}

/**
* Helper to recursively collect all imports into the sources object
*/
function _collectSources(filePath, allSourcesObj) {
  const absolutePath = path.resolve(filePath);
  
  // 1. Force POSIX style (forward slashes) for the map key
  let relativePath = path.relative(path.resolve('.'), absolutePath);
  relativePath = relativePath.split(path.sep).join('/'); 
  
  if (allSourcesObj[relativePath]) return allSourcesObj;

  const content = fs.readFileSync(absolutePath, 'utf8');
  allSourcesObj[relativePath] = { content };

  // 2. Resolve imports and recurse
  const importRegex = /import\s+(?:\{[^}]*\}\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    const resolvedImportPath = path.resolve(path.dirname(absolutePath), importPath);
    _collectSources(resolvedImportPath, allSourcesObj);
  }

  return allSourcesObj;
}
