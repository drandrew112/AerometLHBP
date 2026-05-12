import os from 'os';

export function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Node.js 18+ esetén a family szám (4), régebbieknél string ('IPv4')
            const isIPv4 = iface.family === 'IPv4' || iface.family === 4;
            
            if (isIPv4 && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}


