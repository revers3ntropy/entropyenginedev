import {} from '../../types/types';

mustBeSignedIn(async () => {
    $(`#delete`).click(async () => {
        signOut();
        await request(`/delete-account/`, apiToken);
        window.location.href = 'https://entropyengine.dev';
    });

    $(`#sign-out`).click(() => {
        signOut();
        window.location.href = 'https://entropyengine.dev';
    });

    const details = await request(`/get-details`, apiToken);

    $(`#username`).html(details.username);
    $(`#email`).html(details.email);
    $(`#name`).html(details.name);
}, () => {});