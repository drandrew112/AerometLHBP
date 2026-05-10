const net = require('net');
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const os = require('os');
const http = require('http');
const fs = require('fs'); // Fájlkezelő beimportálása
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const AURORA_IP = '127.0.0.1';
const AURORA_PORT = 1130;
const HTTP_PORT = 80;
const logFilePath = path.join(process.cwd(), 'server.log');

let serverIP = getLocalIpAddress();

function updateStatusLine() {
    const clientCount = io.sockets.sockets.size;
    const time = new Date().toTimeString().split(' ')[0];
    
    // Elmentjük a kurzort -> 1;1-re ugrunk -> Kiírjuk a csíkot -> Visszaállítjuk a kurzort
    // A \x1b[K törli a sort, hogy ne maradjon ott régi szöveg
    const status = `\x1b[s\x1b[1;1H\x1b[48;5;250m\x1b[38;5;16m [\x1b[34m|\x1b[30m] vAMET LHBP :: \x1b[31m${clientCount}\x1b[30m clients :: \x1b[31m${serverIP}:${HTTP_PORT} \x1b[K\x1b[0m\x1b[u`;
    
    process.stdout.write(status);
}
setInterval(updateStatusLine, 1000);

function writeToLog(message) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logEntry = `[${timestamp}] ${message}\n`;
    
    // appendFileSync-et használunk, hogy ne kelljen callback-ekkel bajlódni kilépéskor
    try {
        fs.appendFileSync(logFilePath, logEntry);
    } catch (err) {
        process.stderr.write(`Could not write to log file: ${err.message}\n`);
    }
}

function consoleLog(message) {
    const time = new Date().toTimeString().split(' ')[0];
    const output = `\x1b[36m[${time}]\x1b[0m ${message}`;
    console.log(output);
    writeToLog(message);
    updateStatusLine();
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return '127.0.0.1';
}

// --- GLOBÁLIS ADATTÁROLÓ ---
let lastAuroraData = "";
let weatherCache = { metar: null, taf: null, atisRaw: "" };

// --- AURORA TCP ---
const client = new net.Socket();
function connectToAurora() {
    client.connect(AURORA_PORT, AURORA_IP, () => consoleLog('Aurora TCP Connected'));
    client.on('data', (data) => { lastAuroraData = data.toString(); });
    client.on('error', () => {});
    client.on('close', () => setTimeout(connectToAurora, 5000));
}
connectToAurora();

// --- ADATFRISSÍTŐ CIKLUS (40 MP) ---
let weatherData = {
    metar: null,
    taf: null,
    atis: ""
};
let cacheData = {
    metar: null,
    taf: null,
    atis: ""
};

// --- LEKÉRŐ FÜGGVÉNYEK ---
async function updateWeatherData(force = false) {
    const clientCount = io.sockets.sockets.size;

    // Csak akkor ugrunk ki, ha nincs kliens ÉS nem kértünk kényszerített frissítést
    if (clientCount === 0 && !force) {
        // consoleLog("Skipping update: No clients connected.");
        return;
    }

    try {
        if (force) {
            consoleLog(`Forced weather update triggered`);
        }
        
        const metarRes = await axios.get('https://aviationweather.gov/api/data/metar?ids=LHBP&format=json');
        const metar = (metarRes.data && metarRes.data.length > 0) ? metarRes.data[0] : null;

        const tafRes = await axios.get('https://aviationweather.gov/api/data/taf?ids=LHBP&format=json');
        const taf = (tafRes.data && tafRes.data.length > 0) ? tafRes.data[0] : null;

        setTimeout(() => {
            cacheData.metar = metar;
            cacheData.taf = taf;
            
            sendDataToClients();
            // consoleLog(`Update successfully sent`);
        }, 500);

    } catch (e) {
        consoleLog("Update Error: " + e.message);
    }
}

async function updateATISData() { // Made for IVAO
    client.write('#ATIS\n');
    cacheData.atis = lastAuroraData;
}

// Future plan:
// VATSIM API for VATSIM ATIS
// docs        https://vatsim.dev/api/data-api/list-atis-stations/
// api link    https://data.vatsim.net/v3/afv-atis-data.json

function sendDataToClients() {
    weatherData.metar = cacheData.metar;
    weatherData.taf = cacheData.taf;
    weatherData.atis = cacheData.atis;
    io.emit('weather_update', weatherData);
}

// --- WEBSOCKET LOGIKA ---
io.on('connection', (socket) => {
    const caller = socket.handshake.address.replace('::ffff:', '');
    const clientCount = io.sockets.sockets.size;
    consoleLog(`${caller}: Connected`);

    // Ha ez az első kliens, kényszerítsünk egy frissítést, hogy azonnal friss adatot kapjon
    if (clientCount === 1) {
        updateWeatherData(true);
    } else {
        // Ha már vannak bent, csak a cache-t kapja meg
        socket.emit('weather_update', weatherData);
    }

    socket.on('disconnect', () => {
        consoleLog(`${caller}: Disconnected`);
    });
});

// Indítás
server.listen(HTTP_PORT, '0.0.0.0', () => {
    fs.writeFileSync(logFilePath, '');

    updateATISData();

    setInterval(updateWeatherData, 40000);
    setInterval(updateATISData, 2000);
    setInterval(sendDataToClients, 2000);

    const ip = getLocalIpAddress();
    console.log("");
    consoleLog(`========== vAMET LHBP ==========`);
    consoleLog(`= Server started`);
    consoleLog(`= IP: ${ip}`);
    consoleLog(`= Port: ${HTTP_PORT}`);
    consoleLog(`= Aurora: ${AURORA_IP}:${AURORA_PORT}`);
    consoleLog(`= Log file: ${logFilePath}`);
    consoleLog(`==================================`);
});
