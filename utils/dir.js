const fs = require('fs');

const check = (dir) => {
    if(!fs.existsSync(dir)){
      fs.mkdirSync(dir, {recursive: true});
    }
  }

  module.exports = {
    check
  }