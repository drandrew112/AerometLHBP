// @ts-ignore
const socket = io({
    transports: ['websocket'],
    upgrade: false
});

import { config, Config } from "./main.js";

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

import { MetarData, TafData, AtisData } from "./defs.js";

let cache_metar: MetarData;

function auto_rwy_selection() {
    const d: MetarData = cache_metar;
    if (!d) return;

    if (d.wspd > 4) {
        if (d.wdir == "VRB") {
            setRwyActive("31L", true);
            setRwyActive("31R", true);
            setRwyActive("13R", false);
            setRwyActive("13L", false);
        } else {
            if (d.wdir >= 220 || d.wdir <= 40) {
                setRwyActive("31L", true);
                setRwyActive("31R", true);
                setRwyActive("13R", false);
                setRwyActive("13L", false);
            } else if (d.wdir < 220 || d.wdir > 40) {
                setRwyActive("31L", false);
                setRwyActive("31R", false);
                setRwyActive("13R", true);
                setRwyActive("13L", true);
            }
        }
    } else {
        setRwyActive("31L", true);
        setRwyActive("31R", true);
        setRwyActive("13R", false);
        setRwyActive("13L", false);
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

function updateAtisLetterTop(letter: string | null | undefined): void {
    const el = document.getElementById("atis-letter-top");
    if (!el) return;
    const clean = (letter ?? "").trim().toUpperCase();
    el.textContent = clean || "-";
}

function updateAtisUI(atisData: AtisData | null) {
    const out_atis = document.getElementById("atis");
    if (!out_atis) return;

    updateAtisLetterTop(atisData?.infoLetter);

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
                if (atis_arr_rwy_dir && atis_arr_rwy_dir !== "31") {
                    arr_color = "text-atis-yellow";
                }
                if (atis_dep_rwy_dir && atis_dep_rwy_dir !== "31") {
                    dep_color = "text-atis-yellow";
                }
            } else if (cache_metar.wdir < 220 || cache_metar.wdir > 40) {
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
        let atisTemplate = "ATIS [ATIS_LETTER], TIME [ATIS_TIME], ARR [ARR], DEP [DEP], TL [TL], [METAR]";

        if (config?.server.networkProvider == "IVAO") {
            atisTemplate = config?.ivao.atisText ||
                "ATIS [ATIS_LETTER], TIME [ATIS_TIME], ARR [ARR], DEP [DEP], TL [TL], [METAR]";
        }

        const atisLetterHTML = `<a class='text-atis-green'>${atisData.infoLetter}</a>`;
        const atisTimeHTML = `<a class='text-atis-green'>${atisData.atisTime}</a>`;
        const arrHTML = `<a class='${arr_color}'>${atisData.arrRunway.join(", ")}</a>`;
        const depHTML = `<a class='${dep_color}'>${atisData.depRunways.join(", ")}</a>`;

        let tflHTML = `<a class='${tfl_color}'>${atisData.transLvl}</a>`;
        if (tfl != correct_tfl) {
            tflHTML += `<a class='text-atis-red'> (${correct_tfl})</a>`;
        }

        const finalAtis = atisTemplate
            .replace(/\[ATIS_LETTER\]/g, atisLetterHTML)
            .replace(/\[ATIS_TIME\]/g, atisTimeHTML || "n/a")
            .replace(/\[ARR\]/g, arrHTML)
            .replace(/\[DEP\]/g, depHTML)
            .replace(/\[TL\]/g, tflHTML)
            .replace(/\[METAR\]/g, cache_metar.rawOb.replace(`METAR `, "") || "n/a")
            .replace(/\[REMARK\]/g, "n/a");

        out_atis.style.display = "block";
        out_atis.innerHTML = finalAtis;

        // Pályák aktiválása az ATIS alapján
        ["31L", "31R", "13L", "13R"].forEach(r => setRwyActive(r, false));

        const allActiveRunways = [...atisData.depRunways, ...atisData.arrRunway];
        allActiveRunways.forEach(rwy => {
            if (rwy) setRwyActive(rwy, true);
        });
    } else {
        out_atis.style.display = "block";
        out_atis.innerHTML = "<a class='text-atis-red'>ATIS data not available!</a>";
        auto_rwy_selection();
    }
}

function updateWindRoses(data: MetarData): void {
    const runways = ["31L", "31R", "13L", "13R"];

    runways.forEach(rwy => {
        const out_dir = document.getElementById(`wind-dir-${rwy}`);
        const out_spd = document.getElementById(`wind-spd-${rwy}`);
        const arrow = document.getElementById(`wind-arrow-${rwy}`);

        if (out_dir) out_dir.textContent = data.wdir?.toString() ?? "---";
        if (out_spd) out_spd.textContent = data.wspd?.toString() ?? "--";

        if (!arrow) return;

        if (data.wdir === "VRB") {
            arrow.style.display = "none";
            arrow.style.transform = "rotate(310deg)";
        } else {
            const direction = Number(data.wdir);

            if (!Number.isFinite(direction)) {
                arrow.style.display = "none";
                return;
            }

            arrow.style.display = "block";

            // A nyíl a szél haladási irányát mutatja:
            // METAR 000° -> dél felé mutató nyíl.
            const displayDirection = (direction + 180) % 360;
            arrow.style.transform = `rotate(${displayDirection}deg)`;
        }
    });
}

async function load_data(
    data: MetarData,
    taf_data: TafData | undefined,
    atis_data: AtisData | null
) {
    const out_qnh = document.getElementById("QNH");
    const out_conditions = document.getElementById("conditions");

    if (!out_qnh || !out_conditions) return;

    if (data && taf_data) {
        out_qnh.innerHTML = data.altim;
        out_conditions.innerHTML = data.cover;

        cache_metar = data;

        updateWindRoses(data);
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
