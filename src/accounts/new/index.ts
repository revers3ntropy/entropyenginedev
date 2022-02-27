let error = $('#error');

const illegalChars = '<>/-"\\`\'?&=';

const usernameElement = $('#username');
const passwordElement = $('#password');
let nameElement = $('#name');
const emailElement = $('#email');

usernameElement.change(() => {
    usernameElement.val(usernameElement.val() || '');
});

passwordElement.change(() => {
    passwordElement.val(passwordElement.val() || '');
});

nameElement.change(() => {
    nameElement.val(nameElement.val() || '');
});

$(`#submit`).click(async () => {
    const username = (usernameElement.val() || '').toString();
    const password = (passwordElement.val() || '').toString();
    const name = (nameElement.val() || '').toString();
    const email = (emailElement.val() || '').toString();

    if (username.length < 3) {
        error.html('Username too short - must be longer than 2 characters');
        return;
    }

    const usernameExists = await window.request('username-exists', {username});
    if (usernameExists.exists === '1') {
        error.html('That username already exists');
        return;
    }

    if (password.length < 5) {
        error.html('Password must be longer than 4 characters');
        return;
    }

    if (name.length < 2) {
        error.html('Name must be longer than 1 character');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        error.html('Not a valid email');
        return;
    }

    for (let char of illegalChars) {
        if (username.includes(char)) {
            error.html('Sorry, your username is invalid. Try removing some special characters.');
            return;
        }
    }

    for (let char of illegalChars) {
        if (password.includes(char)) {
            error.html('Sorry, your password is invalid. Try removing some special characters.');
            return;
        }
    }

    for (let char of illegalChars) {
        if (name.includes(char)) {
            error.html('Sorry, your name is invalid. Try removing some special characters.');
            return;
        }
    }

    await window.request('new-user', {
        username,
        password,
        name,
        email,
    });

    window.location.href = 'https://entropyengine.dev/accounts/sign-in';
});