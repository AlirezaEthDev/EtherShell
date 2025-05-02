const path = require('path');
const fs = require('fs');
const solc = require('solc');

const compile = (fullpath, buildPath) => {

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

  if(!buildPath){
    const outputDir = path.resolve('..', 'build');

    if(!fs.existsSync(outputDir)){
      fs.mkdirSync(outputDir, {recursive: true});
    }
  
    const outputPath = path.join(outputDir, [filename]+'.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Contract compiled into ${outputPath}`);
  }else{
    const outputPath = path.join(buildPath, [filename]+'.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Contract compiled into ${outputPath}`);
  }
}

module.exports = {
  compile
}