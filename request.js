export async function request (url, body={}) {
    let response = await fetch(`https://entropyengine.dev:50001${url}`, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    let rb = response.body;

    const reader = rb.getReader();

    let stream = new ReadableStream({
        start (controller) {
            // The following function handles each data chunk
            function push() {
                // "done" is a Boolean and value a "Uint8Array"
                reader.read()
                    .then( ({done, value}) => {
                        // If there is no more data to read
                        if (done) {
                            controller.close();
                            return;
                        }
                        // Get the data and send it to the browser via the controller
                        controller.enqueue(value);
                        // Check chunks by logging to the console
                        push();
                    });
            }
            push();
        }
    });
    
    let result = await (new Response(stream, {
        headers: {
            "Content-Type": 'application/json'
        }
    }).text());

    try {
        return JSON.parse(result);
    } catch (E) {
        return result;
    }
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
