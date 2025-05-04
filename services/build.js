const path = require('path');
const fs = require('fs');
const solc = require('solc');
const dir = require('../utils/dir');
const builder = require('../utils/builder');

const compile = (fullpath, buildPath, selectedContracts = []) => {

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
            builder.build(solFiles[i], buildPath, selectedContracts);
          }
          console.log(`Contract compiled into ${path.resolve(buildPath)}`);
        }
      }
    }else{
      if(!buildPath){    
          buildPath = path.resolve('..', 'build');
          [buildPath].forEach(dir.check); 
      }
      builder.build(fullpath, buildPath, selectedContracts);
      console.log(`Contract compiled into ${path.resolve(buildPath)}`);
    }
  }catch(err){
    console.error(err);
  }

}

module.exports = {
  compile
}