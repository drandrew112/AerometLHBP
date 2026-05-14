import net from 'net';

import { consoleLog } from '../lib/logger.js';
import { config } from '../index.js';

import * as Defs from './../lib/defs.js';

// NOT COMPLETED YET, THIS IS JUST A PLACEHOLDER

export class VatsimConnector implements Defs.NetworkProvider {
    public name: string;
    public config: any
    public apiUrl: string;

    constructor(_apiUrl: string) {
        this.name = "VATSIM";
        this.config = config.vatsim;
        this.apiUrl = _apiUrl;
    }

    parseVatsimAtis (rawAtis: string): Defs.AtisData {
        return {
            infoLetter: "",
            atisTime: "",
            icao: "",
            arrRunway: [],
            depRunways: [],
            transAlt: "",
            transLvl: ""
        };
    }

    async getATIS(): Promise<Defs.AtisData | false> {
        const parsedATIS: Defs.AtisData | false = this.parseVatsimAtis("");
        if (parsedATIS) {
            return parsedATIS;
        } else {
            return false;
        }
    }
}