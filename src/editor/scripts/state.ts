import {reRender} from "./renderer";
import {reloadScriptsOnEntities} from "./scripts";

import {v2, Entity, EntropyEngine} from "entropy-engine";

export const projectID = window.urlParam('p');

if (!projectID) {
	throw 'no project id specified';
}

window.apiToken.project = parseInt(projectID);

window.parseBool = (s: string) => s === 'true';

export const canvasID = 'myCanvas';
const c = document.getElementById(canvasID);
if (!(c instanceof HTMLCanvasElement)) {
	throw 'canvas not a canvas';
}
export const canvas = c;
export const ctx = c.getContext('2d');

if (!ctx) {
	throw 'context is not defined';
}

export const { run } = EntropyEngine({
	canvasID
});

// scripts script
export const scripts: {[k: string]: string} = {};
export const scriptURLS: {[k: string]: string} = {};

window.switchScripts = (script: string) => {
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
export enum states {
	sceneView,
	scriptEditor,
	gameView,
	assets,
	sceneSettings,
	comments
}
window.sceneView = states.sceneView;
window.scriptEditor = states.scriptEditor;
window.gameView = states.gameView;
window.assets = states.assets;
window.sceneSettings = states.sceneSettings;
window.comments = states.comments;

export const state: {
	dragging: boolean,
	running: boolean,
	sceneCamera: Entity | null,
	selectedEntity: Entity | null,
	window: states,
	eeReturns: any,
	currentScript: string,
	dragStart: v2,
	dragEnd: v2,
} = {
	window: parseInt(localStorage.statewindow) ?? states.sceneView,
	eeReturns: {},
	currentScript: localStorage.currentScript ?? '',
	dragging: false,
	dragStart: v2.zero,
	dragEnd: v2.zero,
	sceneCamera: null,
	selectedEntity: null,
	running: false
};

export const setSelected = (sprite: Entity | null) => void (state.selectedEntity = sprite);

export const setState = (newState: states) => {
	if (state.window === newState) return;

	reloadScriptsOnEntities();
	localStorage.statewindow = newState;

	state.window = newState;
	reRender();
};
window.setState = setState;

// effects
$('#share').attr('href', (_, v) => v + projectID);
$('#build-button').attr('href', (_, v) => v + projectID);