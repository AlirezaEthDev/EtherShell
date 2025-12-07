/**
 * @fileoverview File system utilities for directory management
 * @description Provides utilities for deleting directories recursively,
 * primarily used for cleaning build directories.
 * @module files
 */

import fs from 'fs';
import path from 'path';

/**
 * Delete a directory recursively
 * @param {string} [dirPath] - Path to the directory to delete. Defaults to './build'
 * @returns {void}
 * @example
 * deleteDirectory('../build');
 * deleteDirectory(); // Deletes default './build' directory
 */
export function deleteDirectory(dirPath){
  try {
    if(!dirPath){    
      dirPath = path.resolve('.', 'build');
    }
    // Check if the directory exists
    if(!fs.existsSync(dirPath)){
      console.log('Path is not a directory');
      return;    
    }

    // For Node.js 14.14.0+ (recommended)
    fs.rmSync(dirPath, { recursive: true, force: true });

    console.log('Directory deleted successfully');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('Directory does not exist');
    } else {
      console.error('Error deleting directory:', err);
    }
  }
}