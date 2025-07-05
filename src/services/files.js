import fs from 'fs';
import path from 'path';

export async function deleteDirectory(dirPath){
  try {
    if(!dirPath){    
      dirPath = path.resolve('..', 'build');
    }
    // Check if the directory exists
    if(!fs.existsSync(dirPath)){
      console.log('Path is not a directory');
      return;    }

    // For Node.js 14.14.0+ (recommended)
    fs.promises.rm(dirPath, { recursive: true, force: true });

    console.log('Directory deleted successfully');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('Directory does not exist');
    } else {
      console.error('Error deleting directory:', err);
    }
  }
}