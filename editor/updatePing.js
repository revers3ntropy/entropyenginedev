import {request} from "../request.js";

async function updatePing () {
	const startTime = performance.now();

	let response = await request('/ping');

	if (!response.ok) {
		console.error('Server ping failed');
		return;
	}

	const time = performance.now() - startTime;

	$('#ping').html(Math.floor(time));
}

setInterval(updatePing, 2000);
updatePing();