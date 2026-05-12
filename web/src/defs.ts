
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

export interface MetarResponse {
    error?: string;
    data?: MetarData;
}

// TAF

export interface TafData {
    icaoId: string;
    rawTAF: string;
}

export interface TafResponse {
    error?: string;
    data?: TafData;
}

// Aurora

export interface AuroraAtisData {
    infoLetter: string;
    icao: string;
    arrRunway: string[];
    depRunways: string[];
    transAlt: string;
    transLvl: string;
}