import readline from 'readline';
import fs from 'fs';
import { startServer } from './server.js';
import { IvaoConnector } from './networks/ivao.js';
import { VatsimConnector } from './networks/vatsim.js';
import { getLocalIpAddress } from './lib/utils.js';
import { initLog } from './lib/logger.js';

// Konfiguráció beolvasása
export const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const currentIp = getLocalIpAddress();

initLog(config.server.logFile);

console.log("\x1b[33m[vAMET] Select network\x1b[0m");
console.log("1 - IVAO (Aurora TCP)");
console.log("2 - VATSIM (API) - Not available yet");

rl.question('> ', async (choice) => {
    let provider;

    if (choice === '2') {
        provider = new VatsimConnector(
            config.vatsim.apiUrl
        );
    } else {
        provider = new IvaoConnector(
            config.ivao.auroraIp, 
            config.ivao.auroraPort
        );
        provider.connect();
    }

    rl.close();
    console.clear();
    console.log(``);
    
    // Átadjuk a configot is a szervernek
    startServer(provider);
}); 