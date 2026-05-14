import os from 'os';

export function getLocalIpAddress(): string {
    const interfaces = os.networkInterfaces();
    
    // Végigkérdezzük az összes hálózati interfészt (pl. Ethernet, Wi-Fi)
    for (const name of Object.keys(interfaces)) {
        const networkInterface = interfaces[name];

        // Ha az adott névhez nincs lista, ugrunk a következőre
        if (!networkInterface) continue;

        for (const iface of networkInterface) {
            // Node.js típusdefiníciók miatt a family ellenőrzése néha trükkös
            // A 'family' lehet string ('IPv4') vagy szám (4)
            const isIPv4 = iface.family === 'IPv4' || (iface.family as any) === 4;
            
            // Ha IPv4 és nem belső (localhost) cím, akkor megvagyunk
            if (isIPv4 && !iface.internal) {
                return iface.address;
            }
        }
    }
    
    // Ha semmit nem találtunk (pl. nincs net), marad a localhost
    return '127.0.0.1';
}