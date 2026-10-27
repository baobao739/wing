"use strict";

const form = document.getElementById("search-form");
const address = document.getElementById("url-input");
const searchEngine = document.getElementById("search-engine");
const error = document.getElementById("error-message");
const errorCode = document.getElementById("error-code");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	prefix: "/wing/",
	files: {
		wasm: "/assets/scramjet.wasm.wasm",
		all: "/assets/scramjet.all.js",
		sync: "/assets/scramjet.sync.js",
	},
});

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

async function init() {
	try {
		await registerSW();
		await navigator.serviceWorker.ready;
		await scramjet.init();
	} catch (err) {
		error.textContent = "Failed to initialize.";
		errorCode.textContent = err.toString();
		throw err;
	}
}

init();

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	try {
		await navigator.serviceWorker.ready;
		await scramjet.init();
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
	frame.frame.id = "proxy-frame";
	document.body.appendChild(frame.frame);
	frame.go(url);
});
