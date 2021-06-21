"use strict";
import entropyEngine, * as ee from "../entropy-engine";
import {Scene, Sprite, spritesFromJSON} from "../entropy-engine";
import {initialiseScenes} from '../entropy-engine/util/JSONprocessor.js';
import {cullString} from '../entropy-engine/util/util.js';

import {genCacheBust, mustBeSignedIn} from '../util.js';
import {request} from '../request.js';

import {reRender} from './render/renderer.js';
import "./builder.js";
import './events.js';
import {loadScripts} from "./scripts.js";
import './state.js';
import {state, scripts, redirectedFrom, projectID, setSelected} from './state.js';

// cache busting
const scriptFetchHeaders = new Headers();
scriptFetchHeaders.append('pragma', 'no-cache');
scriptFetchHeaders.append('cache-control', 'no-cache');

const scriptFetchInit = {
    method: 'GET',
    headers: scriptFetchHeaders,
};

async function initFromFiles (id) {
    const path = `../projects/${id}`;
    const config = {};

    // get and init the
    const data_ = await fetch(path + `/index.json?c=${genCacheBust()}`, scriptFetchInit);
    const data = await data_.json();

    for (let key in data) {
        if (['sprites', 'scenes'].includes(key))
            continue;

        config[key] = data[key];
    }

    initialiseScenes(data['scenes'] || []);

    state.sceneCamera = new Sprite({
        components: [
            new ee.Camera({})
        ]
    });

    state.eeReturns = entropyEngine(config);

    await spritesFromJSON(data['sprites']);

    setSelected(Sprite.sprites[0]);

    import(`../projects/${projectID}/scripts.js?c=${genCacheBust()}`)
        .then (scripts => {
            for (const sprite of Sprite.sprites) {
                for (const component of sprite.components) {
                    if (component.type !== 'Script') continue;

                    component.script = new (scripts[component.name || component.scriptName])();
                    component.public ??= component.script.public;
                }
            }
            reRender();
        });

    ee.Camera.main = state.sceneCamera;
    console.log('loaded camera');

    ee.Scene.active = parseInt(sessionStorage.sceneID) || 0;
}

async function checkCredentials(callback) {
    mustBeSignedIn(async () => {
        const accessLevel = (await request('/get-project-access', {
            projectID,
            userID: localStorage.id
        })).accessLevel;

        if (accessLevel < 1) {
            window.location.href = 'https://entropyengine.dev/accounts/error?type=projectAccessDenied';
            return;
        }
        console.log(`ACCESS LVL: ${accessLevel}`);

        if (!accessLevel) return;
        
        callback(accessLevel);
    });
}

checkCredentials(async accessLevel => {
    // it is safe now

    await loadScripts();
    state.currentScript = Object.keys(scripts)[0];

    await initFromFiles(projectID)

    switch (redirectedFrom) {
        case 'import':
        case 'assets':
            setState(assets);
            break;

        default:
            reRender();
            break;
    }

    const data = await request('/get-project-name', {
        projectID
    });

    const name = cullString(data.name, 16);
    $(`#project-name`).html(name);
    document.title = name;
});

// show ping
async function updatePing () {
    const startTime = performance.now();

    let response = await request('/ping', {});

    if (!response.ok) {
        console.error('Server ping failed');
        return;
    }

    const time = performance.now() - startTime;

    $('#ping').html(Math.floor(time));
}

setInterval(updatePing, 2000);
updatePing();
