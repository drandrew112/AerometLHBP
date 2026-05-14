import fs from 'fs';
import path from 'path';
import { getLocalIpAddress } from './utils.js';

import { config } from '../index.js';

let logFilePath = path.join(process.cwd(), 'server.log');

export function initLog(logFile: string) {
    logFilePath = path.isAbsolute(logFile) ? logFile : path.join(process.cwd(), logFile);
    fs.writeFileSync(logFilePath, '');
}

export function writeToLog(message: string) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logEntry = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(logFilePath, logEntry);
    } catch (err) {
        process.stderr.write(`Could not write to log file: ${String(err)}\n`);
    }
}

export function updateStatusLine(clientCount: number, providerName: string = "N/A") {
    // ANSI kódok magyarázata:
    // \x1b[s      - Kurzor pozíció mentése
    // \x1b[1;1H   - Kurzor mozgatása az 1. sor 1. oszlopába
    // \x1b[48;5;235m - Háttérszín beállítása (sötétszürke)
    // \x1b[38;5;255m - Szövegszín beállítása (fehér)
    // \x1b[32m    - Zöld szín (a számokhoz és a névhez)
    // \x1b[K      - Sor törlése a kurzortól a végéig (háttérszín kitöltéséhez)
    // \x1b[u      - Kurzor pozíció visszaállítása
    
    const bgColor = "\x1b[48;5;235m";
    const textColor = "\x1b[38;5;255m";
    const green = "\x1b[32m";
    const reset = "\x1b[0m";

    const status = `\x1b[s\x1b[1;1H${bgColor}${textColor} vAMET ${config.server.airport.toUpperCase()} | ${getLocalIpAddress()}:${config.server.port} | ${green}${clientCount}${textColor} clients | ${green}${providerName}${bgColor} \x1b[K${reset}\x1b[u`;
    
    process.stdout.write(status);
}

export function consoleLog(msg: string) {
    const time = new Date().toTimeString().split(' ')[0];
    console.log(`\x1b[36m[${time}]\x1b[0m ${msg}`);
    writeToLog(msg);
};
