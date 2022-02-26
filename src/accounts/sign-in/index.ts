window.validID(localStorage.id).then(valid => {
    if (valid) {
        window.location.href = 'https://entropyengine.dev/accounts';
        return;
    }

    $(`#submit`).click(async () => {
        const username = $('#username').val();
        const password = $('#password').val();

        localStorage.id = (await window.request('get-id', undefined, {
            username,
            password
        }))._id;

        window.validID(localStorage.id)
            .then(valid => {
                if (valid) {
                    window.location.href = 'https://entropyengine.dev/accounts';
                    return;
                }

                $('#warning').html(`
                        Sorry, that account doesn't exist
                    `);
            });
    });
});