/**
 * Make sure the connection is open and throw appropriate error if it not
 */
async function networkError () {
    let location = window.location.href;
    window.location.href = 'https://entropyengine.dev/accounts/error?type=serverPingFailed&cb=' + encodeURIComponent(location);
    await new Promise(_ => {});
}

const apiPort = '50001';
const apiURL = `https://entropyengine.dev:${apiPort}`;

let checkedServerConnection = false;

async function checkServerConnection () {
    checkedServerConnection = true;
    return new Promise<void>(async resolve => {
        try {
            const ping = await window.request('ping')
                .catch(async () => {
                    await networkError();
                });
            if (!ping.ok) {
                await networkError();
            }
        } catch (E) {
            await networkError();
        }

        resolve();
    });
}

/**
 *
 * @param {string} url - does not start with /
 * @param [body={}]
 * @return {Promise<object>}
 */
window.request = async (url: string, body={}) => {

    // only throw error if both can't connect to backend AND backend is actually needed
    // prevents static pages going down if server goes down
    if (!checkedServerConnection) {
        await checkServerConnection();
    }

    window.apiToken.user ||= localStorage.id;

    let response = await fetch(`${apiURL}/${url}`, {
        method: 'POST',
        body: JSON.stringify({
            ...body, token: window.apiToken
        })
    }).catch(networkError);

    if (!response) {
        return { error: 'no response' };
    }

    return await response.json();
}



