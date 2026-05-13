import net from 'net';

import { consoleLog } from '../lib/logger.js';
import { config } from '../index.js';

export class IvaoConnector {
    constructor(ip, port) {
        this.name = "IVAO";
        this.ip = ip;
        this.port = port;
        this.client = new net.Socket();
        this.lastData = "";
        this.isConnected = false;
        this.config = config.ivao;

        this.lastAtisLetter = null;
        this.atisTime = null;

        // A figyelőket CSAK EGYSZER állítjuk be itt, a konstruktorban
        this.setupListeners();
    }

    setupListeners() {
        this.client.on('connect', () => {
            this.isConnected = true;
            consoleLog('Aurora TCP Connected');
        });

        this.client.on('data', (data) => {
            this.lastData = data.toString();
        });

        this.client.on('error', (err) => {
            // Itt ne logoljunk hibát minden másodpercben, ha Aurora nem fut
            this.isConnected = false;
        });

        this.client.on('close', () => {
            if (this.isConnected) {
                consoleLog('Aurora connection lost. Reconnecting...');
            }
            this.isConnected = false;
            // 5 másodperc múlva újra próbáljuk a csatlakozást
            setTimeout(() => this.connect(), 5000);
        });
    }

    connect() {
        // Csak akkor próbálunk csatlakozni, ha épp nincs élő kapcsolat
        if (!this.client.connecting && !this.isConnected) {
            this.client.connect(this.port, this.ip);
        }
    }

    parseAuroraAtis (rawAtis) {
        if (!rawAtis || !rawAtis.startsWith('#ATIS') || rawAtis.split(';').length < 5) return null;
        
        const parts = rawAtis.split(';');
        // Ha nincs megadva ATIS betűjel (üres a szekció), tekintsük érvénytelennek
        if (!parts[1] || parts[1] === "") return null;

        if (this.lastAtisLetter != parts[1] || this.lastAtisLetter === null) {
            const now = new Date();
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            this.atisTime = `${hours}${minutes}Z`;
        }

        this.lastAtisLetter = parts[1];

        return {
            infoLetter: parts[1],
            atisTime: this.atisTime || "",
            icao: parts[2],
            arrRunway: parts[3] ? parts[3].trim().split(' ') : [],
            depRunways: parts[4] ? parts[4].trim().split(' ') : [],
            transAlt: parts[5],
            transLvl: parts[6]
        };
    }

    async getATIS() {
        if (this.isConnected) {
            try {
                this.client.write('#ATIS\n');
            } catch (e) {
                consoleLog("TCP Write error: " + e.message);
            }
        }

        const parsedATIS = this.parseAuroraAtis(this.lastData);
        if (parsedATIS) {
            return parsedATIS;
        } else {
            return false;
        }
    }
}