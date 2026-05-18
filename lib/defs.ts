export interface Config {
    server: {
        port: number;
        logFile: string;
        statusLineUpdateInterval: number;
        weatherUpdateInterval: number;
        clientUpdateInterval: number;
        airport: string;
        networkProvider: string;
    },
    ivao: {
        auroraIp: string;
        auroraPort: number;
        atisUpdateInterval: number;
        atisText: string;
    },
    vatsim: {
        apiUrl: string;
        stationId: string;
        atisUpdateInterval: number;
    }
}

export interface NetworkProvider {
    name: string;
    config: any;
    getATIS: () => Promise<AtisData | false>;
}

export interface Data {
    metar: string;
    taf: string;
    atis: AtisData | null | false; 
}

export interface AtisData {
    infoLetter: string;
    atisTime: string;
    icao: string;
    arrRunway: string[];
    depRunways: string[];
    transAlt: string;
    transLvl: string;
    rawText?: string;
}

export interface VatsimAtisData {
    cid: number;
    name: string;
    real_name: string;
    callsign: string;
    frequency: string;
    facility: number;
    rating: number;
    latitude: number;
    longitude: number;
    server: string;
    visual_range: number;
    atis_code: string;
    text_atis: string[];
    last_updated: string;
    logon_time: string;
}

export interface VatsimAtisResponse {
    atis: VatsimAtisData[];
}
