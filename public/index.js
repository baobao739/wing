"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
    prefix: "/wing/",          // keep this
    files: {
        wasm: "/scram/scramjet.wasm.wasm",
        all: "/scram/scramjet.all.js",
        sync: "/scram/scramjet.sync.js",
    },
});

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

// Better init: register SW first, then init Scramjet
async function initScramjet() {
    try {
        await registerSW();
        await navigator.serviceWorker.ready;
        await scramjet.init();
    } catch (err) {
        error.textContent = "Failed to initialize Scramjet.";
        errorCode.textContent = err.toString();
        throw err;
    }
}

// Call it once on page load
initScramjet();

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        // Make sure everything is ready
        await navigator.serviceWorker.ready;
        await scramjet.init();   // safe to call again
    } catch (err) {
        error.textContent = "Failed to register service worker.";
        errorCode.textContent = err.toString();
        throw err;
    }

    const url = search(address.value, searchEngine.value);

    let wispUrl =
        (location.protocol === "https:" ? "wss" : "ws") +
        "://" +
        location.host +
        "/wisp/";

    if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [
            { websocket: wispUrl },
        ]);
    }

    const frame = scramjet.createFrame();
    frame.frame.id = "sj-frame";
    document.body.appendChild(frame.frame);
    frame.go(url);
});
