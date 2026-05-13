import net from 'net';

import { consoleLog } from '../lib/logger.js';
import { config } from '../index.js';

// NOT COMPLETED YET, THIS IS JUST A PLACEHOLDER

export class VatsimConnector {
    constructor(apiUrl) {
        this.name = "VATSIM";
        this.config = config.vatsim;
        this.apiUrl = apiUrl;
    }

    parseVatsimAtis (rawAtis) {
        return {
            infoLetter: "",
            atisTime: "",
            icao: "",
            arrRunway: "",
            depRunways: "",
            transAlt: "",
            transLvl: ""
        };
    }

    async getATIS() {
        const parsedATIS = this.parseVatsimAtis(this.lastData);
        if (parsedATIS) {
            return parsedATIS;
        } else {
            return false;
        }
    }
}