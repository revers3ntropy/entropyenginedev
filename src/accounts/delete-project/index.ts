projectID = urlParam('p') || '0';
let confirmButton = $('#confirm');

apiToken.project = parseInt(projectID);

request('/get-project-name', apiToken).then(async value => {
    confirmButton.html(`
            <p style="font-size: 30px">
                Are you sure you want to delete the project
                <a href="../../editor?p=${projectID}">
                    ${value.name}
                </a>?
            </p>
        `);

    $('#timer').css('animation', 'timer-shrink 2000ms ease');

    await sleep(2000);

    window.delete = () => {
        request('delete-project', apiToken);
        window.location.href = 'https://entropyengine.dev/accounts/my-projects';
    };

    confirmButton.append(`
        <br>
        <button onclick="window.delete()" style="font-size: 20px">
            Yes
        </button>
    `);

});