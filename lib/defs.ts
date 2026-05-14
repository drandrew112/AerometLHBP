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
}
