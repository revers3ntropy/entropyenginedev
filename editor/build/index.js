import { urlParam } from '../../util.js';
import { request } from '../../request.js';
import {download} from '../downloader.js';

const projectID = urlParam('p');

document.getElementById('back').href += projectID;

const buildURL = `https://entropyengine.dev/projects/${projectID}/build/`;

document.getElementById('play-build').href = buildURL;

$('#share-url').html(buildURL);
$('#go-to-build').click(() => {
	// open in new tab
	window.open(buildURL, '_blank');
});

$('#copy-url-to-clipboard').click(() => {
	copyToClipboard(buildURL);
});

function copyToClipboard(text) {
	const clipboard = document.getElementById('clipboard');
	clipboard.value = text;
	clipboard.select();
	clipboard.setSelectionRange(0, 99999); /* For mobile devices */
	document.execCommand("copy");
	clipboard.innerText = '';
}

request('/get-project-name', {projectID}).then(name => {
	$('#project-name').append(name.name);

	window.downloadHTML = async () => {
		const response = await fetch(`../../projects/${projectID}/build/index.html`);
		const html = await response.text();

		download(name.name + '.html', html);
	};
});

window.build = () => {
	document.write('Sorry, looks like theres been a problem.... try reloading the page');
};

request('/has-been-built', {projectID}).then(hasBeenBuilt => {
	const beenBuilt = hasBeenBuilt.built;

	let building = false;

	window.build = async () => {
		if (building) return;
		building = true;

		const button = $('#build');
		button.html('building...');

		request('/build-project', {
			projectID
		}).then(() => {
			button.css('display', 'none');
			button.html('');
			$('#has-built').css('display', 'inline');
		});
	};

	if (!beenBuilt) return;

	$('#has-built').css('display', 'inline');
});

