import "./defs.js";
import "./app.js";

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

export let config: Config | null = null;

fetch("/config")
.then(res => {
    if (!res.ok) throw new Error("Hiba a letöltés során");
    return res.json();
})
.then(res => {
    if (!res.server || !res.ivao || !res.vatsim) return;

    config = res;
    const airportCode = res.server.airport;
    if (airportCode) {   
        const out_airport_code = document.getElementById("airport_code");
        if (out_airport_code) {
            out_airport_code.textContent = airportCode.toUpperCase();
        }
    }
})
.catch(err => {
    console.error("Failed to load config:", err);
});


