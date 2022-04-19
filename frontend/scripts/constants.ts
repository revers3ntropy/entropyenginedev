// get rid of port if one is included
export const HOST = window.location.host.split(':').shift();
export const DEV = HOST === 'localhost' || HOST === '127.0.0.1';
export const SITE_ROOT = `http${DEV ? '' : 's'}://${window.location.host}`;
console.log(SITE_ROOT);

if (!DEV && HOST !== 'entropyengine.dev') {
    throw `unexpected site root: ${HOST}`;
}

export const apiPort = '50001';
export const apiURL = `http${DEV ? '' : 's'}://${DEV ? 'localhost' : HOST}:${apiPort}`;