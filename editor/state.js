"use strict";

import {urlParam} from "../util.js";
import entropyEngine from "../entropy-engine/1.0/index.js";
import {reRender} from "./renderer.js";
import {reloadScriptsOnEntities} from "./scripts.js";
import {global} from "../entropy-engine/1.0/scripting/EEScript/constants.js";
import {APIToken} from "../request.js";
import {v2} from "../entropy-engine";

export let globalEESContext = global;

export const projectID = urlParam('p');

export const apiToken = new APIToken({
	project: projectID
});

window.parseBool = string => string === 'true';

export const canvasID = 'myCanvas';
export const canvas = document.getElementById(canvasID);
export const ctx = canvas.getContext('2d');

export const { run } = entropyEngine({
	canvasID
});

// scripts script
export const scripts = {};
export const scriptURLS = {};

window.switchScripts = script => {
	state.currentScript = script;
	localStorage.currentScript = script;
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
	window: parseInt(localStorage.statewindow) ?? sceneView,
	eeReturns: {},
	currentScript: localStorage.currentScript ?? '',
	dragging: false,
	dragStart: v2.zero,
	dragEnd: v2.zero,
	sceneCamera: null,
	selectedEntity: null,
	running: false
};

export const setSelected = sprite => state.selectedEntity = sprite;

export const setState = newState => {
	if (state.window === newState) return;

	reloadScriptsOnEntities();
	localStorage.statewindow = newState;

	state.window = newState;
	reRender();
};
window.setState = setState;

// effects
document.getElementById('share').href += projectID;
document.getElementById('build-button').href += projectID;