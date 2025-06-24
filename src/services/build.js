import path from 'path';
import fs from 'fs';
import solc from 'solc';
import { check } from '../utils/dir.js';
import { setVersion, build } from '../utils/builder.js';

let currentSolcInstance = solc; // default local compiler

export function updateCompiler(version){
  setVersion(version, currentSolcInstance)
    .then((solcInstance) => currentSolcInstance = solcInstance)
    .catch(err => console.error(err));
}

export function currentCompiler(){
  return currentSolcInstance.version();
}

export function compile(fullpath, selectedContracts, buildPath){
  try{
    const fileExt = path.extname(fullpath);

    if(!fileExt){
      const files = fs.readdirSync(fullpath);
      let solFiles = [];
      if(!files.length){
        throw 'The directory is empty!';
      }else{
        for(i = 0; i < files.length; i++){
          const fileExtension = path.extname(files[i]);
          if(fileExtension == '.sol'){
            const solFilePath = path.join(fullpath, `${files[i]}`);
            solFiles.push(solFilePath);
          }
        }
        if(!solFiles.length){
          throw 'There is no smart contract in the directory!';
        }else{
          for(i = 0; i < solFiles.length; i++){
            build(solFiles[i], buildPath, selectedContracts);
          }
          console.log(`Contract compiled into ${path.resolve(buildPath)}`);
        }
      }
    }else{
      if(!buildPath){    
          buildPath = path.resolve('..', 'build');
          [buildPath].forEach(check); 
      }
      build(fullpath, buildPath, selectedContracts);
      console.log(`Contract compiled into ${path.resolve(buildPath)}`);
    }
  }catch(err){
    console.error(err);
  }
}