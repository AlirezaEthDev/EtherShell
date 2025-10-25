import fs from 'fs';
import path from 'path';

export function check(dir){
    if(!fs.existsSync(dir)){
      fs.mkdirSync(dir, {recursive: true});
    }
}

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

export function findImports(importPath, basePath) {
  try {
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