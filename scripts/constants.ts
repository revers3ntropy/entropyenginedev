const SITE_ROOT = window.location.host.split(':').shift();

console.log(SITE_ROOT);

export const DEV = SITE_ROOT === 'localhost' || SITE_ROOT === '127.0.0.1';

if (!DEV && SITE_ROOT !==  'entropyengine.dev') {
    throw `unexpected site root: ${SITE_ROOT}`;
}

export const apiPort = '50001';
export const apiURL = `http${DEV ? '' : 's'}://${DEV ? 'localhost' : SITE_ROOT}:${apiPort}`;