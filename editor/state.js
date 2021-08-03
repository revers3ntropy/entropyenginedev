"use strict";

import {urlParam} from "../util.js";
import entropyEngine from "../entropy-engine/1.0/index.js";
import * as ee from "../entropy-engine/1.0/index.js";
import {reRender} from "./render/renderer.js";
import {reloadScriptsOnEntities} from "./scripts.js";
import {init as initEES} from "../entropy-engine/1.0/scripting/EEScript";
import {global, globalConstants} from "../entropy-engine/1.0/scripting/EEScript/constants.js";

export let globalEESContext = global;

globalConstants['CircleCollider'] = ee.CircleCollider;
globalConstants['RectCollider'] = ee.RectCollider;
globalConstants['Script'] = ee.Script;
globalConstants['TriangleV2'] = ee.TriangleV2;
globalConstants['TriangleV3'] = ee.TriangleV3;
globalConstants['MeshV2'] = ee.MeshV2;
globalConstants['MeshV3'] = ee.MeshV3;
globalConstants['Body'] = ee.Body;
globalConstants['CircleRenderer'] = ee.CircleRenderer;
globalConstants['RectRenderer'] = ee.RectRenderer;
globalConstants['ImageRenderer2D'] = ee.ImageRenderer2D;
globalConstants['MeshRenderer'] = ee.MeshRenderer;
globalConstants['GUIBox'] = ee.GUIBox;
globalConstants['GUIText'] = ee.GUIText;
globalConstants['GUITextBox'] = ee.GUITextBox;
globalConstants['GUIRect'] = ee.GUIRect;
globalConstants['GUICircle'] = ee.GUICircle;
globalConstants['GUIPolygon'] = ee.GUIPolygon;
globalConstants['GUIImage'] = ee.GUIImage;
globalConstants['Camera'] = ee.Camera;
globalConstants['Transform'] = ee.Transform;

initEES();

export let redirectedFrom = urlParam('from');
export const projectID = urlParam('p');

window.parseBool = string => string === 'true';

export const canvasID = 'myCanvas';
export const canvas = document.getElementById(canvasID);
export const ctx = canvas.getContext('2d');

export const { run, background } = entropyEngine({
	canvasID
});

// scripts script
export const scripts = {};
export const scriptURLS = {};

window.switchScripts = script => {
	state.currentScript = script;
	reRender();
};

export function numScripts () {
	let count = 0;
	for (let i in scripts)
		count++;
	return count;
}

// global state

// window state management
window.sceneView = 0;
export const sceneView = window.sceneView;
window.scriptEditor = 1;
export const scriptEditor = window.scriptEditor;
window.gameView = 2;
export const gameView = window.gameView;
window.assets = 3;
export const assets = window.assets;
window.sceneSettings = 4;
export const sceneSettings = window.sceneSettings;
window.comments = 5;
export const comments = window.comments;

export const state = {
	window: sceneView,
	eeReturns: {},
	currentScript: '',
	dragging: false,
	dragStart: ee.v2.zero,
	dragEnd: ee.v2.zero,
	sceneCamera: null,
	selectedEntity: null,
};

export const setSelected = sprite => state.selectedEntity = sprite;

export const setState = newState => {
	if (state === newState) return;

	reloadScriptsOnEntities();

	state.window = newState;
	reRender();
};
window.setState = setState;

// effects

if (!redirectedFrom) {
	redirectedFrom = sessionStorage.from;
	sessionStorage.from = '';
} else {
	sessionStorage.from = redirectedFrom;
	window.location.href = `https://entropyengine.dev/editor/?p=${projectID}`;
}

document.getElementById('share').href += projectID;
document.getElementById('build-button').href += projectID;