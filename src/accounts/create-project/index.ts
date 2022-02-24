error = $('#error');
nameElement = $('#name');

document.addEventListener('keypress', () => {
    nameElement.val(nameElement.val());
});

$(`#submit`).click(async () => {
    const name = nameElement.val();

    if (name.length < 5) {
        error.html('Name must be longer than 4 character');
        return;
    }

    const id = await request('new-project', apiToken, {name});

    window.location.href = 'https://entropyengine.dev/editor?p=' + id.projectID;
});