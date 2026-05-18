
// METAR

export interface MetarData {
    icaoId: string;
    receiptTime: string;
    obsTime: Date;
    reportTime: string;
    temp: number;
    dewp: number;
    wdir: any;
    wspd: number;
    visib: string;
    altim: string;
    qcField: number;
    metarType: string;
    rawOb: string;
    lat: number;
    lon: number;
    elev: number;
    name: string;
    cover: string;
    clouds?: [];
    fltCat: string;
}

// TAF

export interface TafData {
    icaoId: string;
    rawTAF: string;
}

// ATIS

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
