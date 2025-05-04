const path = require('path');
const fs = require('fs');
const solc = require('solc');
const dir = require('./dir');

const build = (fullpath, buildPath, selectedContracts) => {
    const source = fs.readFileSync(fullpath, 'utf8');
    const filename = path.basename(fullpath, '.sol');
    
    const input = {
        language: 'Solidity',
        sources: {
          [filename]: {
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
    
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
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
    subPaths.forEach(dir.check);
    
    const allContracts = Object.keys(output.contracts[filename]);
    const contractsToSave = selectedContracts.length > 0 ? allContracts.filter(
        (contractName) => {
          return selectedContracts.includes(contractName);
        } 
      ): allContracts;
    contractsToSave.forEach((contractName) => {
        const contractsData = output.contracts[filename][contractName];
    
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
    })

}

module.exports = {
    build
}
