import path from 'path';
import fs from 'fs';
import solc from 'solc';
import { check } from '../utils/dir.js';
import { setVersion, build } from '../utils/builder.js';

let currentSolcInstance = solc; // default local compiler

// Global compiler configuration state
let compilerConfig = {
  optimizer: false,
  optimizerRuns: 200,
  viaIR: false
};

export function updateCompiler(version){
  setVersion(version, currentSolcInstance)
    .then((solcInstance) => currentSolcInstance = solcInstance)
    .catch(err => console.error(err));
}

export function currentCompiler(){
  return currentSolcInstance.version();
}

// Export the compilerOptions function
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
      compilerConfig.optimizer = gasOptimizer;
      compilerConfig.viaIR = viaIR;
      compilerConfig.optimizerRuns = optimizerRuns;

      // Provide user feedback
      console.log('✓ Compiler options updated:');
      console.log(`  Gas Optimizer: ${compilerConfig.optimizer ? 'Enabled' : 'Disabled'}`);
      if (compilerConfig.optimizer) {
          console.log(`  Optimizer Runs: ${compilerConfig.optimizerRuns}`);
      }
      console.log(`  ViaIR: ${compilerConfig.viaIR ? 'Enabled' : 'Disabled'}`);
      
      return compilerConfig;
  } catch (error) {
      console.error('Error setting compiler options:', error.message);
      return null;
  }
}

// Function to get current compiler options
export function getCompilerOptions() {
  return { ...compilerConfig };
}

export function compile(fullpath, selectedContracts, buildPath){
  try{
    // Set default path if buildPath is undefined
    if(!buildPath){    
      buildPath = path.resolve('..', 'build');
      [buildPath].forEach(check); 
    }
    const fileExt = path.extname(fullpath);

    if(!fileExt){
      const files = fs.readdirSync(fullpath);
      let solFiles = [];
      if(!files.length){
        throw 'The directory is empty!';
      }else{
        for(let i = 0; i < files.length; i++){
          const fileExtension = path.extname(files[i]);
          if(fileExtension == '.sol'){
            const solFilePath = path.join(fullpath, `${files[i]}`);
            solFiles.push(solFilePath);
          }
        }
        if(!solFiles.length){
          throw 'There is no smart contract in the directory!';
        }else{
          for(let i = 0; i < solFiles.length; i++){
            build(solFiles[i], selectedContracts, buildPath);
          }
          console.log(`Contract compiled into ${path.resolve(buildPath)}`);
        }
      }
    }else{
      build(fullpath, selectedContracts, buildPath);
      console.log(`Contract compiled into ${path.resolve(buildPath)}`);
    }
  }catch(err){
    console.error(err);
  }
}