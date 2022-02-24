import {} from '../../../types/types';

const error = $('#error');
const nameElement = $('#name');

document.addEventListener('keypress', () => {
    nameElement.val(nameElement.val() || '');
});

$(`#submit`).click(async () => {
    const name = (nameElement.val() || '').toString();

    if (name.length < 5) {
        error.html('Name must be longer than 4 character');
        return;
    }

    const id = await request('new-project', apiToken, {name});

    window.location.href = 'https://entropyengine.dev/editor?p=' + id.projectID;
});