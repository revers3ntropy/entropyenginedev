window.mustBeSignedIn(async () => {
    $(`#delete`).click(async () => {
        window.signOut();
        await window.request(`delete-account`, window.apiToken);
        window.location.href = 'https://entropyengine.dev';
    });

    $(`#sign-out`).click(() => {
        window.signOut();
        window.location.href = 'https://entropyengine.dev';
    });

    const details = await window.request(`get-details`, window.apiToken);

    $(`#username`).html(details.username);
    $(`#email`).html(details.email);
    $(`#name`).html(details.name);
}, () => {});