import {} from '../../types/types';
import {} from '../../node_modules/@types/jquery';

const errorDIV = $('#error');
const projectID = urlParam('p');
$('back').attr('href', (_, v) => v + projectID);
$('see-contributors').attr('href', (_, v) => v + projectID);

apiToken.project = parseInt(projectID || '0');

const usernameElement = $('#username');
const accessElement = $('#access');

$(`#submit`).click(async () => {
    const username = usernameElement.val();
    const accessLevel = accessElement.val();

    if (username) {
        const usernameExists = await request('username-exists', apiToken, {
            username: username
        });
        if (usernameExists.exists !== '1') {
            errorDIV.html('That username doesn\'t seem to exist exists');
            return;
        }
    }
    let {error} = await request('share-project', apiToken, {
        username,
        accessLevel
    });
    window.location.href = error ? `../accounts/error` : `../editor`;
});