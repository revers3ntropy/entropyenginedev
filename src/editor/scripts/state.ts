import entropyEngine from "entropy-engine/src";
import {reRender} from "./renderer.js";
import {reloadScriptsOnEntities} from "./scripts";
import {global} from "entropy-script/src";
import {v2} from "entropy-engine/src";
import { Entity } from "entropy-engine/src";

export let globalEESContext = global;

export const projectID = urlParam('p');

if (!projectID) {
	throw 'no project id specified';
}

apiToken.project = parseInt(projectID);

window.parseBool = (s: string) => s === 'true';

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

export const state: {
	dragging: boolean,
	running: boolean,
	sceneCamera: Entity | null,
	selectedEntity: Entity | null,
	window: any,
	eeReturns: any,
	currentScript: string,
	dragStart: v2,
	dragEnd: v2,
} = {
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

export const setSelected = (sprite: Entity) => state.selectedEntity = sprite;

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