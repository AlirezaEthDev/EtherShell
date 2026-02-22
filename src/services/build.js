/**
 * @fileoverview Solidity compiler management and contract compilation
 * @description Manages Solidity compiler versions, compilation settings, and
 * provides functions to compile smart contracts with customizable options.
 * @module build
 */

import path from 'path';
import { check, collectSolFiles } from '../utils/dir.js';
import { 
  setVersion,
  build, 
  extractLoadableVersion 
} from '../utils/builder.js';
import fs from 'fs';
import { 
  generateAllTypes,
} from '../utils/typeGenerator.js';
import { 
  configPath,
  configFile,
  compConfig
} from './configSync.js';

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

    // Update config file
    configFile.compiler.optimizer = compConfig.optimizer;
    configFile.compiler.viaIR = compConfig.viaIR;
    configFile.compiler.optimizerRuns = compConfig.optimizerRuns;
    fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));

    // Provide user feedback
    console.log('✓ Compiler options updated:');
    console.log(`  Gas Optimizer: ${compConfig.optimizer ? 'Enabled' : 'Disabled'}`);
    console.log(`  ViaIR: ${compConfig.viaIR ? 'Enabled' : 'Disabled'}`);
    if (compConfig.optimizer) {
        console.log(`  Optimizer Runs: ${compConfig.optimizerRuns}`);
    }

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
  return { ...configFile.compiler };
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
      buildPath = compConfig.compilePath;
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

////////////////////
  // Generate aggregated ABI after compilation
  const abisDir = path.join(buildPath, 'abis');
  const aggregatedAbiPath = path.join(buildPath, 'aggregated.abi.json');

  if (fs.existsSync(abisDir)) {
    const files = fs.readdirSync(abisDir).filter(f => f.endsWith('.abi.json'));

    const aggregated = [];
    for (const file of files) {
      const p = path.join(abisDir, file);
      try {
        const abi = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (Array.isArray(abi)) {
          aggregated.push(...abi);
        } else {
          console.warn(`ABI file ${file} is not an array, skipping from aggregation`);
        }
      } catch (e) {
        console.warn(`Failed to read ABI file ${file} for aggregation: ${e.message}`);
      }
    }

    fs.writeFileSync(aggregatedAbiPath, JSON.stringify(aggregated, null, 2));
    console.log('Aggregated ABI generated at', path.resolve(aggregatedAbiPath));
  } else {
    console.warn('No ABI directory found, aggregated ABI not generated.');
  }

////////////////////

    // Generate TypeScript types
    const typesOutputPath = path.join(buildPath, 'types');
    generateAllTypes(buildPath, typesOutputPath);
    console.log(`TypeScript types generated in ${path.resolve(typesOutputPath)}`);
  } catch(err){
      console.error(err);
  }
}

/**
 * Changes the default path to generate build files there
 * @param {string} newPath - The new path to build
 */
export function changeCompPath(newPath) {
  compConfig.compilePath = newPath;
  configFile.compiler.compilePath = compConfig.compilePath;
  fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));
}

/**
 * Flatten a Solidity contract and its imports into a single file.
 *
 * @param {string} fullPath - Path to the root .sol file.
 * @param {string} [outFile] - Optional path for the flattened output file.
 *                             Defaults to `<dir>/<name>.flattened.sol`.
 */
export function flatten(fullPath, outFile) {
  if (!fullPath) {
    throw new Error('flatten(): fullPath to the root Solidity file is required.');
  }

  const entryPath = path.resolve(fullPath);
  if (!fs.existsSync(entryPath)) {
    throw new Error(`flatten(): entry file does not exist: ${entryPath}`);
  }

  const visited = new Set();
  const pieces = [];

  let pragmaLine = null;
  let hasSpdx = false;

  function processFile(absPath, logicalName) {
    if (visited.has(absPath)) return;
    visited.add(absPath);

    const raw = fs.readFileSync(absPath, 'utf8');

    const lines = raw.split(/\r?\n/);

    // Capture pragma and SPDX once from the entry or first file
    for (const line of lines) {
      const trimmed = line.trim();
      if (!pragmaLine && trimmed.startsWith('pragma solidity')) {
        pragmaLine = trimmed.replace(/[; ]+$/, ';');
      }
      if (!hasSpdx && trimmed.startsWith('// SPDX-License-Identifier:')) {
        hasSpdx = true;
      }
    }

    const imports = parseImports(raw);
    for (const importPath of imports) {
      const resolved = resolveImportPath(importPath, path.dirname(absPath));
      processFile(resolved, importPath);
    }

    // Strip SPDX, pragma, and import lines from the body
    const body = lines
      .filter((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('// SPDX-License-Identifier:')) return false;
        if (trimmed.startsWith('pragma solidity')) return false;
        if (trimmed.startsWith('import ')) return false;
        return true;
      })
      .join('\n');

    pieces.push(`\n\n// File: ${logicalName}\n\n${body}\n`);
  }

  const logicalName = path.basename(entryPath);
  processFile(entryPath, logicalName);

  let header = '';
  if (hasSpdx) {
    // Multiple different licenses may be mixed; explicit about it
    header += '// SPDX-License-Identifier: MIXED\n';
  }
  if (pragmaLine) {
    header += `${pragmaLine}\n\n`;
  }

  const flattened = `${header}${pieces.join('')}`;

  const defaultOut =
    outFile ||
    path.join(
      path.dirname(entryPath),
      `${path.basename(entryPath, '.sol')}.flattened.sol`,
    );

  fs.writeFileSync(defaultOut, flattened);
  console.log('Flattened contract written to', path.resolve(defaultOut));
}

/*============================= HELPER ==============================*/
// --- FLATTENING UTILITIES ---

function resolveImportPath(importPath, fromDir) {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return path.resolve(fromDir, importPath);
  }
  // Node-style imports from node_modules
  return path.resolve(process.cwd(), 'node_modules', importPath);
}

function parseImports(content) {
  const imports = [];
  const importRegex =
    /import\s+(?:(?:["']([^"']+)["'])|(?:.*?\sfrom\s+["']([^"']+)["']))\s*;/g;
  let match;
  while ((match = importRegex.exec(content))) {
    const importPath = match[1] || match[2];
    if (importPath) imports.push(importPath);
  }
  return imports;
}
