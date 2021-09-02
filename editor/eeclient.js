import {state} from "./state.js";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const projectID = urlParams.get('p');

function localhost (path, body, success, error) {
	try {
		fetch('http://localhost:5501/'+path, {
			body: JSON.stringify(body),
			method: 'POST'
		})
			.then(success)
			.catch(error);
	} catch (e) {
		error(e);
	}
}

async function check () {
	localhost('ping', {}, async response => {
		if (state.running) return;
		response = await response.text();
		if (response !== '1') {
			setTimeout(check, 1000);
			return;
		}

		authenticateServer();
	}, () => setTimeout(check, 1000)
	);

}

check();

function authenticateServer () {
	localhost('authenticate-connection', {
		user: localStorage.id,
		project: projectID
	}, async response => {
		response = await response.text();
		if (response !== '1') {
			setTimeout(check, 500);
			return;
		}
		console.log('Connected to localhost');
		waitForChanges();
	}, () => setTimeout(check, 500));
}

function waitForChanges () {
	localhost('changed', {}, async response => {
		if (state.running) return;
		response = await response.text();
		if (response !== '1') {
			setTimeout(waitForChanges, 500);
			return;
		}
		window.location.reload();

	}, () => setTimeout(check, 500));
}