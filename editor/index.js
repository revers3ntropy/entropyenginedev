"use strict";
import entropyEngine, * as ee from "../entropy-engine";
import {Sprite, Camera, v2} from "../entropy-engine";
import {getMousePos} from '../entropy-engine/input.js';
import {spritesFromJSON} from '../entropy-engine/JSONprocessor.js';
import {screenSpaceToWorldSpace} from '../entropy-engine/util.js';
//import {circle} from '../entropy-engine/renderer.js';

import {urlParam, genCacheBust, mustBeSignedIn} from '../util.js';
import {request} from '../request.js';

import {reRender, reRenderCanvas, reRenderCanvasDebug, reRenderSceneToolbar} from './renderer.js';
import * as builder from "./builder.js";
import * as events from './events.js';
import {loadScripts} from "./renderScript.js";
import {setSelectedSpriteFromClick} from './events.js';

builder;
events;

export const projectID = urlParam('p');

export let redirectedFrom = urlParam('from');

if (!redirectedFrom) {
    redirectedFrom = sessionStorage.from;
    sessionStorage.from = '';
} else {
    sessionStorage.from = redirectedFrom;
    window.location.href = `https://entropyengine.dev/editor/?p=${projectID}`;
}

document.getElementById('share').href += projectID;
document.getElementById('build-button').href += projectID;

// global state
export let selectedSprite = null;

export const setSelected = sprite => selectedSprite = sprite;

export const canvasID = 'myCanvas';
export const canvas = document.getElementById(canvasID);
export const ctx = canvas.getContext('2d');

export let dragging = false;
let dragStart = v2.zero;
let dragEnd = v2.zero;

canvas.addEventListener('click', event => {
    if (state !== sceneView) return;
    const mousePos = getMousePos(canvas, event);
    const clickPos = screenSpaceToWorldSpace(mousePos, sceneCamera, canvas);
    setSelectedSpriteFromClick(clickPos);
});


canvas.addEventListener('mousedown', event => {
    if (event.button !== 2) return;
    dragStart = getMousePos(canvas, event);
    dragging = true;
});

canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
}, false);

canvas.addEventListener('mouseup', event => {
    if (event.button !== 2) return;
    dragging = false;
});

function drag (event) {
    dragEnd = getMousePos(canvas, event);
    const diff = dragEnd.clone.sub(dragStart);

    const camZoom = sceneCamera.getComponent('Camera').zoom;

    diff.scale(1/camZoom);
    // reverse to drag naturally in the right direction
    diff.scale(-1);
    sceneCamera.transform.position.add(diff);
    dragStart = dragEnd;

    reRenderCanvas();
    reRenderCanvasDebug();
    reRenderSceneToolbar();
}

canvas.addEventListener('mousemove', evt => {
    if (!Camera.main) return;
    if (state !== sceneView) return;

    // update world and screen space values in scene view toolbar

    const screenSpace = getMousePos(canvas, evt);
    const worldSpace = screenSpaceToWorldSpace(screenSpace, sceneCamera, canvas);

    const worldSpaceDIV = $('#world-space-pos');
    const screenSpaceDIV = $('#screen-space-pos');

    worldSpaceDIV.html(`
			${worldSpace.x.toFixed(2)} | ${worldSpace.y.toFixed(2)}
		`);
    screenSpaceDIV.html(`
			${screenSpace.x.toFixed(2)} | ${screenSpace.y.toFixed(2)}
		`);


    // for debug
    // circle(ctx, screenSpace, 2, 'rgb(255, 0, 0)');

    if (dragging) drag(event);

}, false);



canvas?.parentNode?.addEventListener('resize', () => {
    reRender();
});

export const { run, background } = entropyEngine({
    canvasID
});

// state management
window.sceneView = 0;
export const sceneView = window.sceneView;
window.scriptEditor = 1;
export const scriptEditor = window.scriptEditor;
window.gameView = 2;
export const gameView = window.gameView;
window.assets = 3;
export const assets = window.assets;

export let state = sceneView;
export const setState = newState => {
    if (state === newState) return;

    state = newState;
    reRender();
};
window.setState = setState;

export const sceneCamera = new Sprite({
    components: [
        new ee.Camera({})
    ]
});

export let eeReturns = {};

// set default script
export let scripts = {};
export let currentScript = '';
loadScripts().then(scripts_ =>  {
    scripts = scripts_;
    currentScript = Object.keys(scripts)[0];
});

window.switchScripts = script => {
    currentScript = script;
    reRender();
};

export function numScripts () {
    let count = 0;
    for (let i in scripts)
        count++;
    return count;
}

async function initFromFiles (id) {

    // cache busting
    const scriptFetchHeaders = new Headers();
    scriptFetchHeaders.append('pragma', 'no-cache');
    scriptFetchHeaders.append('cache-control', 'no-cache');

    const scriptFetchInit = {
        method: 'GET',
        headers: scriptFetchHeaders,
    };

    const path = `../projects/${id}`;
    const config = {};

    // get and init the
    const data_ = await fetch(path + `/index.json?c=${genCacheBust()}`, scriptFetchInit);
    const data = await data_.json();

    for (let key in data) {
        if (key === 'sprites')
            continue;

        config[key] = data[key];
    }

    eeReturns = entropyEngine(config);

    await spritesFromJSON(data['sprites']);

    setSelected(Sprite.sprites[0]);

    ee.Camera.main = sceneCamera;
}

async function checkCredentials(callback) {
    mustBeSignedIn(async () => {
        const accessLevel = await request('/get-project-access', {
            projectID,
            userID: localStorage.id
        });
        callback(accessLevel);
    });
}

checkCredentials(accessLevel => {
    if (accessLevel.accessLevel < 1) {
        window.location.href = 'https://entropyengine.dev/accounts/error?type=projectAccessDenied';
        return;
    }

    console.log(`ACCESSLVL: ${accessLevel.accessLevel}`);
    if (!accessLevel.accessLevel) return;

    initFromFiles(projectID)
        .then(reRender)
        .then(() => {
            if (redirectedFrom === 'import') setState(assets);
        });

    request('/get-project-name', {
        projectID
    }).then(name => {
        $(`#project-name`).html(name.name);
        document.title = name.name;
    })
});

