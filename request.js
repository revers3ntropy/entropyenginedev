/**
 * Make sure the connection is open and throw appropriate error if it not
 */
export function networkError () {
    let location = window.location.href;
    window.location.href = 'https://entropyengine.dev/accounts/error?type=serverPingFailed&cb=' + encodeURIComponent(location);
}

export class APIToken {
    /**
     * Returns a json that canbe used to talk to the Node server
     * @param {number} project - project ID
     * @param {number} user - user ID
     */
    constructor ({
        project = -1,
        user = localStorage.id
    }) {
        this.project = project;
        this.user = user;
    }
}

/**
 *
 * @param {string} url - must start with a '/'
 * @param {APIToken} token
 * @param {object} body
 * @return {Promise<object>}
 */
export async function request (url, token = new APIToken({}), body={}) {
    if (!(token instanceof APIToken)) {
        console.error(`Backend API token must be of type 'APIToken': `, token);
        return {};
    }
    let response = await fetch(`https://entropyengine.dev:50001${url}`, {
        method: 'POST',
        body: JSON.stringify({
            ...body, token
        })
    }).catch(networkError);

    return await response.json();
}

try {
    request('/ping')
        .then(ping => {
            if (!ping.ok)
                networkError();
        })
        .catch((error) => {
            networkError();
        });
} catch (E) {
    networkError();
}
