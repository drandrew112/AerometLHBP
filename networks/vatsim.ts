import net from 'net';

import { consoleLog } from '../lib/logger.js';
import { config } from '../index.js';

import * as Defs from './../lib/defs.js';
import { text } from 'stream/consumers';

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

    parseVatsimAtis(rawAtis: string): Defs.AtisData {
        // Example: BUDAPEST INFORMATION H . TIME 1800. RUNWAY DIRECTION 31 . EXPECT ILS APPROACH RUNWAY 31R. DEPARTURE RUNWAY 31R. TRANSITION LEVEL 110 . WIND 300 DEGREES 6 KNOTS. CAVOK . TEMPERATURE 15 . DEWPOINT 6 . QNH 1014 HECTOPASCALS. NO SIGNIFICANT CHANGES ARE FORECAST. ATTENTION RUNWAY 31L CLOSED DUE MAINTENANCE. REQUEST ATC CLEARANCE ON DELIVERY. FOR STARTUP CONTACT GROUND ONLY WHEN INSTRUCTED. ACKNOWLEDGE INFORMATION H .
        const parts = rawAtis.split('.').map(part => part.trim());
        
        let atisData: Defs.AtisData = {
            infoLetter: "",
            atisTime: "",
            icao: config.server.airport, // Get from config
            arrRunway: [],
            depRunways: [],
            transAlt: this.config.transAlt || "10000", // Default to 10000 if not specified
            transLvl: "",
            rawText: rawAtis // Store the raw ATIS text for reference
        };

        // FIX: Changed 'foreach' to standard TypeScript 'for' loop
        for (const part of parts) {
            // 1. Parse Information Letter
            if (part.startsWith("BUDAPEST INFORMATION")) {
                const match = part.match(/BUDAPEST INFORMATION ([A-Z])/);
                if (match) atisData.infoLetter = match[1];
            }
            
            // 2. Parse Time
            else if (part.startsWith("TIME")) {
                const match = part.match(/TIME (\d{4})/);
                if (match) atisData.atisTime = match[1];
            }
            
            // 3. Parse Expected Approach Runway (Arrivals)
            else if (part.startsWith("EXPECT")) {
                // Extracts runway identifiers like 31R, 13L, 31, etc.
                const match = part.match(/RUNWAY (\d{2}[LRC]?)/);
                if (match) atisData.arrRunway = [match[1]];
            }
            
            // 4. Parse Departure Runway
            else if (part.startsWith("DEPARTURE RUNWAY")) {
                const match = part.match(/DEPARTURE RUNWAY (\d{2}[LRC]?)/);
                if (match) atisData.depRunways = [match[1]];
            }
            
            // 5. Parse Transition Level
            else if (part.startsWith("TRANSITION LEVEL")) {
                const match = part.match(/TRANSITION LEVEL (\d{3})/);
                if (match) atisData.transLvl = match[1];
            }
        }

        return atisData;
    }

    async getATIS(): Promise<Defs.AtisData | false> {
        const response = await fetch(this.apiUrl);
        const data: Defs.VatsimAtisResponse = await response.json();
        const atisEntry = data.atis.find((entry: any) => entry.station === this.config.stationId);
        if (atisEntry) {
            const parsedATIS = this.parseVatsimAtis(atisEntry.text_atis.join(" "));
            return parsedATIS;
        }
        return false;
    }
}