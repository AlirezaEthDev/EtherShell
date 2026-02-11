import {
    configFile,
    configPath
} from '../services/config.js';
import fs from 'fs';

export function changeProvider(url) {
    configFile.providerEndpoint = url;
    fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));
}