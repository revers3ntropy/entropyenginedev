/**
 * Make sure the connection is open and throw appropriate error if it not
 */
function networkError () {
    let location = window.location.href;
    window.location.href = 'https://entropyengine.dev/accounts/error?type=serverPingFailed&cb=' + encodeURIComponent(location);
}

const apiPort = '50001';
const apiURL = `https://entropyengine.dev:${apiPort}`;

/**
 *
 * @param {string} url - does not start with /
 * @param {apiTok} token
 * @param {{[k: string]: any}} body
 * @return {Promise<object>}
 */
request = async (url: string, token: apiTok = {user: -1, project: -1}, body={}) => {
    if (!token.project || !token.user) {
        console.error(`Bad API token: `, token);
        return {};
    }
    let response = await fetch(`${apiURL}/${url}`, {
        method: 'POST',
        body: JSON.stringify({
            ...body, token
        })
    }).catch(networkError);

    if (!response) {
        return { error: 'no response' };
    }

    return await response.json();
}

try {
    request('ping')
        .then(ping => {
            if (!ping.ok) {
                networkError();
            }
        })
        .catch(() => {
            networkError();
        });
} catch (E) {
    networkError();
}
