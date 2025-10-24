import path from 'path';
import fs from 'fs';
import solc from 'solc';
import { check } from './dir.js';
import { getCompilerOptions } from '../services/build.js';
import { LocalStorage } from 'node-localstorage';

const localStorage = new LocalStorage('./localStorage');

export function loadSolcVersion(version){
  return new Promise((resolve, reject) => {
    solc.loadRemoteVersion(version, (err, solcInstance) => {
      if (err) reject(err);
      else resolve(solcInstance);
    });
  });
}

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

export function build(fullPath, selectedContracts, buildPath){
    if(!selectedContracts){
      selectedContracts = [];
    }

    const compilerConfig = getCompilerOptions();
    const source = fs.readFileSync(fullPath, 'utf8');

    const filename = path.basename(fullPath, '.sol');
    
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
        },
    }

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
    
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if(output.errors) {
      throw output.errors;
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
      ]
    
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

        // Store  abis and bytecode on local storage
        localStorage.setItem(`${contractName}_abi`, abisPath);
        localStorage.setItem(`${contractName}_bytecode`, bytecodePath);
    })
}
