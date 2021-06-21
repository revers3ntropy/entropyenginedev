"use strict";

import {urlParam} from "../util.js";
import entropyEngine, {v2} from "../../entropy-engine/index.js";
import {reRender} from "./render/renderer.js";

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
window.comments = 4;
export const comments = window.comments;

export const state = {
	window: sceneView,
	eeReturns: {},
	currentScript: '',
	dragging: false,
	dragStart: v2.zero,
	dragEnd: v2.zero,
	sceneCamera: null,
	selectedSprite: null,
};

export const setSelected = sprite => state.selectedSprite = sprite;

export const setState = newState => {
	if (state === newState) return;

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