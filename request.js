export async function request (url, body={}) {
    let response = await fetch(`https://entropyengine.dev:50001${url}`, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    return await response.json();
}

// make sure the connection is open and throw appropriate error if it not
export function networkError () {
    window.location.href = 'https://entropyengine.dev/accounts/error?type=serverPingFailed';
}
try {
    request('/ping').then(ping => {
        if (!ping.ok)
            networkError();
    });
} catch (E) {
    networkError();
}
