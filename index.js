import entropyEngine, {v2, Sprite, Camera} from "./entropy-engine";
import * as ee from "./entropy-engine";

import { reRender } from './renderer.js';
import * as builder from "./builder.js";
builder;
import * as events from './events.js';
import {scriptTemplate} from "./renderScript.js";
events;

// global state
export let selectedSprite = null;

export function setSelected (sprite) {
    selectedSprite = sprite;
}

export const canvasID = 'myCanvas'
export const canvas = document.getElementById(canvasID);
export const ctx = canvas.getContext('2d');

export const { run, background, width, height } = entropyEngine({
    canvasID,
    width: 600,
    height: 500
});

// state management
window.sceneView = 0;
export const sceneView = window.sceneView;
window.scriptEditor = 1;
export const scriptEditor = window.scriptEditor;
export let state = sceneView;
window.setState = newState => {
    state = newState;
    reRender();
}
export const setState = window.setState;

// set default script
export const scripts = {'playerController': scriptTemplate('playerController')};
export let currentScript = 'playerController';
window.switchScripts = script => {
    currentScript = script;
    reRender();
}

export function numScripts () {
    let count = 0;
    for (let _ in scripts)
        count++;
    return count;
}

Camera.main = Sprite.newSprite({
    name: 'main camera',
    components: [
        new ee.Camera({zoom: 5})
    ]
})

const sprite = Sprite.newSprite({
    name: 'sprite',
    transform: new ee.Transform({
        scale: new v2(5, 5)
    }),
    components: [
        new ee.RectRenderer({}),
        new ee.RectCollider({})
    ]
});
selectedSprite = sprite;

const child = Sprite.newSprite({
    name: 'sprite child',
    transform: new ee.Transform({
        scale: new v2(1, 1),
        position: new v2(10, 10),
        parent: sprite.transform
    }),
    components: [
        new ee.RectRenderer({}),
        new ee.RectCollider({})
    ]
});

Sprite.newSprite({
    name: 'sprite grandchild',
    transform: new ee.Transform({
        scale: new v2(1.5, 1),
        position: new v2(5, 5),
        parent: child.transform
    }),
    components: [
        new ee.CircleRenderer({
            zLayer: 0,
            colour: '#ff0000'
        }),
        new ee.CircleCollider({})
    ]
});

reRender();