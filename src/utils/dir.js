/**
 * @fileoverview Directory and file utilities for Solidity projects
 * @description Provides utilities for directory management, collecting Solidity files,
 * and resolving contract imports during compilation.
 * @module dir
 */

import fs from 'fs';
import path from 'path';

/**
 * Check if directory exists and create it if it doesn't
 * @param {string} dir - Directory path to check/create
 * @returns {void}
 * @example
 * check('./build/artifacts');
 */
export function check(dir){
    if(!fs.existsSync(dir)){
      fs.mkdirSync(dir, {recursive: true});
    }
}

/**
 * Recursively collect all Solidity files from a directory
 * @param {string} dirPath - Root directory to search for .sol files
 * @returns {Array<string>} Array of absolute paths to .sol files
 * @example
 * const solFiles = collectSolFiles('./contracts');
 * // Returns: ['./contracts/Token.sol', './contracts/utils/SafeMath.sol']
 */
export function collectSolFiles(dirPath) {
  let solFiles = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for(const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    
    if(entry.isDirectory()) {
      // Recursively collect from subdirectories
      solFiles = solFiles.concat(collectSolFiles(entryPath));
    } else if(entry.isFile() && path.extname(entry.name) === '.sol') {
      solFiles.push(entryPath);
    }
  }
  return solFiles;
}

/**
 * Resolve Solidity import paths for the compiler
 * @param {string} importPath - Import path from Solidity import statement
 * @param {string} basePath - Base directory of the importing file
 * @returns {Object} Object with 'contents' property containing file content or 'error' property
 * @example
 * const result = findImports('./Token.sol', './contracts');
 * // Returns: { contents: "pragma solidity ^0.8.0;..." } or { error: "File not found" }
 */
export function findImports(importPath, basePath) {
  try {
    // Handle node_modules imports (e.g., @openzeppelin/contracts/...)
    if (importPath.startsWith('@')) {
      const nodeModulesPath = path.resolve(process.cwd(), 'node_modules', importPath);
      
      if (fs.existsSync(nodeModulesPath)) {
        const content = fs.readFileSync(nodeModulesPath, 'utf8');
        return { contents: content };
      }
    }

    // Resolve relative to the current file's directory
    const resolvedPath = path.resolve(basePath, importPath);
    
    if (fs.existsSync(resolvedPath)) {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      return { contents: content };
    }
    
    // If not found, try relative to contracts root
    const contractsRoot = path.resolve('.', 'contracts');
    const rootPath = path.resolve(contractsRoot, importPath);
    
    if (fs.existsSync(rootPath)) {
      const content = fs.readFileSync(rootPath, 'utf8');
      return { contents: content };
    }
    
    return { error: 'File not found' };
  } catch (e) {
      return { error: e.message };
  }
}