import fs from 'fs';

export function check(dir){
    if(!fs.existsSync(dir)){
      fs.mkdirSync(dir, {recursive: true});
    }
}