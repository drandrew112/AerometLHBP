import "./defs.js";
import "./app.js";

fetch("/config")
.then(res => {
    if (!res.ok) throw new Error("Hiba a letöltés során");
    return res.json();
})
.then(config => {
    // Ellenőrizzük, hogy minden objektum létezik-e az útvonalon
    const airportCode = config?.server?.airport;
    
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


