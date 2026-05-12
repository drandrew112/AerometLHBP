import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import cors from 'cors';
import { updateStatusLine, writeToLog } from './lib/logger.js';

import { consoleLog } from './lib/logger.js';
import { config } from './index.js';

export async function startServer(networkProvider) {const app = express();
    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: "*" } });

    // A config-ból vesszük a portot és az időzítéseket
    const HTTP_PORT = config.server.port;
    const WEATHER_INTERVAL = config.server.weatherUpdateInterval;

    app.use(cors());
    app.use(express.static('./web/'));

    let cacheData = { metar: null, taf: null, atis: null };

    const updateWeather = async (force = false) => {
        if (io.sockets.sockets.size === 0 && !force) return;
        try {
            const metar = await axios.get('https://aviationweather.gov/api/data/metar?ids=LHBP&format=json');
            const taf = await axios.get('https://aviationweather.gov/api/data/taf?ids=LHBP&format=json');
            cacheData.metar = metar.data?.[0] || null;
            cacheData.taf = taf.data?.[0] || null;
        } catch (e) { consoleLog("Weather Update Error: " + e.message); }
    };

    const updateATIS = async () => {
        const atis = await networkProvider.getATIS();
        cacheData.atis = atis;
    };

    const sendDataToAllClients = () => {
        if (io.sockets.sockets.size === 0) return;
        io.emit('weather_update', cacheData);
    }

    io.on('connection', (socket) => {
        consoleLog(`${socket.handshake.address.replace('::ffff:', '')}: Connected`);
        updateWeather(true);
        socket.emit('weather_update', cacheData);
        socket.on('disconnect', () => {
            consoleLog(`${socket.handshake.address.replace('::ffff:', '')}: Disconnected`);
            updateStatusLine(io.sockets.sockets.size, networkProvider.name);
        });
    });

    // Időzítők
    setInterval(() => updateStatusLine(io.sockets.sockets.size, networkProvider.name), config.server.statusLineUpdateInterval);
    setInterval(updateWeather, WEATHER_INTERVAL);
    setInterval(updateATIS, config.server.atisUpdateInterval);
    setInterval(sendDataToAllClients, config.server.clientUpdateInterval);

    server.listen(HTTP_PORT, '0.0.0.0', () => {
        consoleLog(`HTTP Server started on port ${HTTP_PORT}`);
    });
}