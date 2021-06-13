"use strict";
import entropyEngine, * as ee from "../entropy-engine";
import {Sprite, Camera, v2, v3, spritesFromJSON, screenSpaceToWorldSpace} from "../entropy-engine";
import {initialiseScenes} from '../entropy-engine/util/JSONprocessor.js';
import {getMousePos} from '../entropy-engine/util/input.js';
import {cullString} from '../entropy-engine/util/util.js';
//import {circle} from '../entropy-engine/render/renderer.js';

import {urlParam, genCacheBust, mustBeSignedIn} from '../util.js';
import {request} from '../request.js';

import {reRender, reRenderCanvas, reRenderCanvasDebug, reRenderSceneToolbar} from './renderer.js';
import * as builder from "./builder.js"; builder;
import * as events from './events.js'; events;
import {loadScripts} from "./renderScript.js";
import {setSelectedSpriteFromClick} from './events.js';

export const projectID = urlParam('p');

export let redirectedFrom = urlParam('from');

window.parseBool = string => string === 'true';

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
    sceneCamera.transform.localPosition.add(diff.v3);
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
window.comments = 4;
export const comments = window.comments;

export let state = sceneView;
export const setState = newState => {
    if (state === newState) return;

    state = newState;
    reRender();
};
window.setState = setState;

export let sceneCamera;

export let eeReturns = {};

// set default script
export let scripts = {};
export let currentScript = '';
loadScripts().then(scripts_ => {
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


    sceneCamera = new Sprite({
        components: [
            new ee.Camera({})
        ]
    });

    eeReturns = entropyEngine(config);

    await spritesFromJSON(data['sprites']);

    setSelected(Sprite.sprites[0]);


    import(`../projects/${projectID}/scripts.js?c=${genCacheBust()}`)
        .then (async scripts => {
            for (const sprite of Sprite.sprites) {
                for (const component of sprite.components) {
                    if (component.type !== 'Script') continue;

                    component.script = new (scripts[component.name || component.scriptName])();
                    component.public ??= component.script.public;
                    reRender();
                }
            }
        });

    ee.Camera.main = sceneCamera;

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

checkCredentials(accessLevel => {

    initFromFiles(projectID)
        .then(reRender)
        .then(() => {
            if (redirectedFrom === 'import') setState(assets);
        });

    request('/get-project-name', {
        projectID
    }).then(data => {
        const name = cullString(data.name, 16);
        $(`#project-name`).html(name);
        document.title = name;
    })
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
