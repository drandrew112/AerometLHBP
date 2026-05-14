import readline from 'readline';
import fs from 'fs';
import { startServer } from './server.js';
import { IvaoConnector } from './networks/ivao.js';
import { VatsimConnector } from './networks/vatsim.js';
import { getLocalIpAddress } from './lib/utils.js';
import { initLog } from './lib/logger.js';

import * as Defs from './lib/defs.js';

// Konfiguráció beolvasása
export const config: Defs.Config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
if (!config || !config.server || !config.ivao || !config.vatsim) {
    console.error("Invalid config.json structure. Please check the file.");
    process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const currentIp = getLocalIpAddress();

initLog(config.server.logFile);

console.log("\x1b[33m[vAMET] Select network\x1b[0m");
console.log("1 - IVAO (Aurora TCP)");
console.log("2 - VATSIM (API) - Not available yet");

rl.question('> ', async (choice) => {
    let provider: Defs.NetworkProvider;

    if (choice === '2') {
        provider = new VatsimConnector(
            config.vatsim.apiUrl
        );
    } else {
        const ivao = new IvaoConnector(
            config.ivao.auroraIp, 
            config.ivao.auroraPort
        );
        ivao.connect();
        provider = ivao;
    }

    rl.close();
    console.clear();
    console.log(``);
    
    // Átadjuk a configot is a szervernek
    startServer(provider);
}); 