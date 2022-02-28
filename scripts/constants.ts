const SITE_ROOT = window.location.host;

export const DEV = SITE_ROOT === 'localhost' || SITE_ROOT === '127.0.0.1';

if (!DEV && SITE_ROOT !==  'entropyengine.dev') {
    throw 'unexpected site root';
}

export const apiPort = '50001';
export const apiURL = `https://${SITE_ROOT}:${apiPort}`;