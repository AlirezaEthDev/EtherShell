import {
    configFile,
    configPath
} from '../services/configSync.js';
import fs from 'fs';

export function changeProvider(url) {
    configFile.providerEndpoint = url;
    fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));
}