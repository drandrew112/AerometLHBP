// @ts-ignore
const socket = io({
    transports: ['websocket'], // Kényszerítsük a tiszta WebSocketet
    upgrade: false
});

// Eseménykezelők
socket.on('connect', () => {
    console.log("Connected to server");
    const out_atis = document.getElementById("atis");
    if (out_atis) {
        out_atis.style.display = "block";
        out_atis.innerHTML = "<a class='text-atis-green'>Connected to server</a>";
    }
});

socket.on('disconnect', () => {
    console.log("Disconnected from server");
    const out_atis = document.getElementById("atis");
    if (out_atis) {
        out_atis.style.display = "block";
        out_atis.innerHTML = "<a class='text-atis-red'>Connection lost with the server! Current weather informations can be outdated!</a>";
    }
});



import { MetarData, TafData, AuroraAtisData } from "./defs.js";

let cache_metar: MetarData;

function auto_rwy_selection() {
    const d: MetarData = cache_metar;
    if (!d) return;
    if (d.wspd > 4) {
        if (d.wdir == "VRB") {
            setRwyActive("31L", true)
            setRwyActive("31R", true)
            setRwyActive("13R", false)
            setRwyActive("13L", false)
        } else {
            if (d.wdir >= 220 || d.wdir <= 40) {
                setRwyActive("31L", true)
                setRwyActive("31R", true)
                setRwyActive("13R", false)
                setRwyActive("13L", false)
            } else if (d.wdir < 220 || d.wdir > 40) {
                setRwyActive("31L", false)
                setRwyActive("31R", false)
                setRwyActive("13R", true)
                setRwyActive("13L", true)
            }
        }
    } else {
        setRwyActive("31L", true)
        setRwyActive("31R", true)
        setRwyActive("13R", false)
        setRwyActive("13L", false)
    }
}


function setRwyActive(rwy: string, state: boolean): void {
    const el = document.getElementById("rwy-" + rwy);
    if (!el) return;
    if (state) {
        el.classList.remove("bg-gray-600");
        el.classList.add("bg-green-600", "text-white");
    } else {
        el.classList.remove("bg-green-600", "text-white");
        el.classList.add("bg-gray-600");
    }
}
// Kattintás támogatás
document.querySelectorAll(".runway-box").forEach(el => {
    el.addEventListener("click", () => {
        const rwy = el.id.replace("rwy-", "");
        const isActive = el.classList.contains("bg-green-600");
        setRwyActive(rwy, !isActive);
    });
});

function updateAtisUI(atisData: AuroraAtisData | null) {
    const out_atis = document.getElementById("atis");
    if (!out_atis) return;

    if (atisData) {
        // RWY Check
        const atis_arr_rwy_dir = atisData.arrRunway[0]?.slice(0, 2);
        const atis_dep_rwy_dir = atisData.depRunways[0]?.slice(0, 2);
        let dep_color = "text-atis-green";
        let arr_color = "text-atis-green";
        if (cache_metar.wdir == "VRB") {
            // RWY DIR (prefered) 31
        } else {
            if (cache_metar.wdir >= 220 || cache_metar.wdir <= 40) {
                // RWY DIR 31
                if (atis_arr_rwy_dir && atis_arr_rwy_dir !== "31") {
                    arr_color = "text-atis-yellow";
                }
                if (atis_dep_rwy_dir && atis_dep_rwy_dir !== "31") {
                    dep_color = "text-atis-yellow";
                }
            } else if (cache_metar.wdir < 220 || cache_metar.wdir > 40) {
                // RWY DIR 13
                if (atis_arr_rwy_dir && atis_arr_rwy_dir !== "13") {
                    arr_color = "text-atis-yellow";
                }
                if (atis_dep_rwy_dir && atis_dep_rwy_dir !== "13") {
                    dep_color = "text-atis-yellow";
                }
            }
        }

        // TFL Check
        const tfl = parseInt(atisData.transLvl);
        let correct_tfl = 110;
        if (cache_metar.altim >= "1013") {
            correct_tfl = 110;
        } else if (cache_metar.altim < "1013") {
            correct_tfl = 120;
        } else if (cache_metar.altim < "997") {
            correct_tfl = 130;
        }
        let tfl_color = "text-atis-green";
        if (tfl != correct_tfl) {
            tfl_color = "text-atis-red";
        }

        // Megjelenítés és tartalom frissítése
        out_atis.style.display = "block";
        let atis_text = `ATIS <a class='text-atis-green'>${atisData.infoLetter}</a>`;
        atis_text += ` - ARR <a class='${arr_color}'>${atisData.arrRunway.join(", ")}</a>`;
        atis_text += ` - DEP <a class='${dep_color}'>${atisData.depRunways.join(", ")}</a>`;
        atis_text += ` - TFL <a class='${tfl_color}'>${atisData.transLvl}</a>`;
        if (tfl != correct_tfl) {
            atis_text += `<a class='text-atis-red'> (${correct_tfl})</a>`;
        }
        out_atis.innerHTML = atis_text;
        
        // Pályák aktiválása az ATIS alapján
        // Először minden pályát lekapcsolunk
        ["31L", "31R", "13L", "13R"].forEach(r => setRwyActive(r, false));
        
        // Bekapcsoljuk azokat, amik az ATIS-ban szerepelnek (Induló + Érkező)
        const allActiveRunways = [...atisData.depRunways, ...atisData.arrRunway];
        allActiveRunways.forEach(rwy => {
            if (rwy) setRwyActive(rwy, true);
        });

    } else {
        // Ha nincs adat, elrejtjük a panelt
        out_atis.style.display = "block";
        out_atis.innerHTML = "<a class='text-atis-red'>ATIS data not available!</a>";
        auto_rwy_selection(); 
    }
}

async function load_data(data: MetarData, taf_data: TafData | undefined, atis_data: AuroraAtisData | null) {
    const out_qnh = document.getElementById("QNH");
    const wind_div = document.getElementById("wind_div");
    const out_wdir = document.getElementById("wind_dir");
    const out_wspd = document.getElementById("wind_spd");
    const out_conditions = document.getElementById("conditions");

    const out_metar = document.getElementById("metar");
    const out_taf = document.getElementById("taf");

    const windArrow = document.getElementById("wind-arrow");
    const arrowHead = document.getElementById("arrow-head");

    if (!out_qnh || !wind_div || !out_wdir || !out_wspd || !out_conditions || !out_metar || !out_taf || !windArrow || !arrowHead) return;

    if (data && taf_data) {
        // Update data
        out_metar.innerHTML = data.rawOb || "METAR N/A";
        out_taf.innerHTML = taf_data.rawTAF || "TAF N/A";

        out_qnh.innerHTML = data.altim;
        out_wdir.innerHTML = data.wdir.toString();
        out_wspd.innerHTML = data.wspd.toString();
        out_conditions.innerHTML = data.cover;

        // Wind background color
        if (data.wspd >= 4) {
            wind_div.classList.remove("bg-green-600");
            wind_div.classList.add("bg-yellow-600");
            wind_div.classList.remove("bg-red-600");
        } else if (data.wspd <= 4) {
            wind_div.classList.add("bg-green-600");
            wind_div.classList.remove("bg-yellow-600");
            wind_div.classList.remove("bg-red-600");
        } else if (data.wspd >= 15) {
            wind_div.classList.remove("bg-green-600");
            wind_div.classList.remove("bg-yellow-600");
            wind_div.classList.add("bg-red-600");
        }

        // Wind arrow rotation
        if (windArrow) {
            if (data.wdir === "VRB") {
                windArrow.style.display = "none"; // VRB esetén elhalványul
                windArrow.style.transform = `rotate(310deg)`;
            } else {
                const direction = Number(data.wdir);
                windArrow.style.display = "block";
                
                // +180 fok, hogy a szélirány átellenes oldalán jelenjen meg
                const displayDirection = (direction + 180) % 360;
                windArrow.style.transform = `rotate(${displayDirection}deg)`;
            }
        }

        cache_metar = data;
        //auto_rwy_selection();

        updateAtisUI(atis_data);
    }
}

socket.on('weather_update', (data: any) => {
    if (!data || !data.metar || !data.taf) {
        console.log("DATA NOT AVAILABLE");
        const out_atis = document.getElementById("atis");
        if (out_atis) {
            out_atis.style.display = "block";
            out_atis.innerHTML = "<a class='text-atis-red'>DATA NOT AVAILABLE!</a>";
        }
        return;
    }

    load_data(data.metar, data.taf, data.atis);
});