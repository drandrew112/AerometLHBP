
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

export const parseAuroraAtis = (data: string): AuroraAtisData | null => {
    if (!data || !data.startsWith('#ATIS') || data.split(';').length < 5) return null;
    
    const parts = data.split(';');
    // Ha nincs megadva ATIS betűjel (üres a szekció), tekintsük érvénytelennek
    if (!parts[1] || parts[1] === "") return null;

    return {
        infoLetter: parts[1],
        icao: parts[2],
        // .trim() és .split(' ') segít, ha több pálya van (pl. "13R 13L")
        arrRunway: parts[3] ? parts[3].trim().split(' ') : [],
        depRunways: parts[4] ? parts[4].trim().split(' ') : [],
        transAlt: parts[5],
        transLvl: parts[6]
    };
};
