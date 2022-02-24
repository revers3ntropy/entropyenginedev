const backButton = <null|HTMLLinkElement>document.getElementById('back');
if (backButton) {
	backButton.href += projectID;
}

const buildURL = `https://entropyengine.dev/play/?p=${projectID}`;

const playBuildButton = <null|HTMLLinkElement>document.getElementById('play-build');
if (playBuildButton) {
	playBuildButton.href = buildURL;
}

$('#share-url').html(buildURL);
$('#go-to-build').click(() => {
	// open in new tab
	window.open(buildURL, '_blank');
});

$('#copy-url-to-clipboard').click(() => {
	copyToClipboard(buildURL);
});

request('/get-project-name', apiToken)
	.then(name => {
		$('#project-name').append(name.name);

		window.downloadHTML = async () => {
			const response = await fetch(`../../projects/${projectID}/build/index.html`);
			const html = await response.text();

			window.download(name.name + '.html', html);
		};
	});

window.build = () => {
	document.write('Sorry, looks like theres been a problem.... try reloading the page');
};

request('/has-been-built', apiToken).then(hasBeenBuilt => {
	const beenBuilt = hasBeenBuilt.built;

	let building = false;

	window.build = async () => {
		if (building) return;
		building = true;

		const button = $('#build');
		button.html('building...');

		request('/build-project', apiToken)
			.then(() => {
				button.css('display', 'none');
				button.html('');
				$('#has-built').css('display', 'inline');
			});
	};

	if (!beenBuilt) {
		return;
	}

	$('#has-built').css('display', 'inline');
});

