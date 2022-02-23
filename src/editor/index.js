"use strict";
import entropyEngine, * as ee from "../entropy-engine/1.0";
import {Entity, entitiesFromJSON} from "../entropy-engine/1.0";
import {initialiseScenes} from '../entropy-engine/1.0/JSONprocessor.js';
import {cullString} from '../entropy-engine/1.0/util/general.js';
import {init} from "../entropy-engine/1.0/scripting/EEScript";

import {genCacheBust, mustBeSignedIn} from '../util.js';
import {request} from '../request.ts';

import "./builder.js";
import './events.js';
import {loadScripts, reloadScriptsOnEntities} from "./scripts.js";
import './state.js';
import {state, scripts, projectID, setSelected, apiToken} from './state.js';

import './updatePing.js';
import './eeclient.js';

// cache busting
const scriptFetchHeaders = new Headers();
scriptFetchHeaders.append('pragma', 'no-cache');
scriptFetchHeaders.append('cache-control', 'no-cache');

const scriptFetchInit = {
    method: 'GET',
    headers: scriptFetchHeaders,
};

async function initFromFiles (id) {
    init();
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

    state.sceneCamera = new Entity({
        components: [
            new ee.Camera({})
        ]
    });

    state.eeReturns = entropyEngine(config);

    await entitiesFromJSON(data['entities'] || []);

    setSelected(Entity.entities[0]);

    await reloadScriptsOnEntities();

    ee.Camera.main = state.sceneCamera;
    ee.Scene.active = parseInt(sessionStorage.sceneID) || 0;
}

async function checkCredentials(callback) {
    mustBeSignedIn(async () => {
        const accessLevel = (await request('/get-project-access', apiToken)).accessLevel;

        if (accessLevel < 1) {
            window.location.href = 'https://entropyengine.dev/accounts/error?type=projectAccessDenied';
            return;
        }
        console.log(`ACCESS LEVEL: ${accessLevel}`);

        if (!accessLevel) return;
        
        callback(accessLevel);
    });
}

checkCredentials(async accessLevel => {
    // it is safe now

    await loadScripts();
    state.currentScript ??= Object.keys(scripts)[0];

    await initFromFiles(projectID)

    const data = await request('/get-project-name', apiToken);

    const name = cullString(data.name, 16);
    $(`#project-name`).html(name);
    document.title = name;
});

