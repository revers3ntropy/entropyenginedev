import {Sprite, Scene} from "../entropy-engine";
import {scripts, projectID} from "./index.js";
import {request} from '../request.js';
import {sleep} from '../util.js';

// needed for it to actually import and run this script
export const myExport = 0;

window.backgroundSave = async () => {
    // raw save, no visible changes
    await request('/save-project', {
        projectID,
        scripts: buildScriptsJS(scripts),
        userID: localStorage.id,
        json: `
        {
            "canvasID": "myCanvas",
            "sprites": [
                ${await buildSpritesJSON(projectID)}
            ],
            "scenes": [
                ${buildScenesJSON()}
            ]
        }
        `
    });
};

window.save = async () => {
    // save with the css changes for teh save button
    const startTime = performance.now();
    const minTime = 500;

    const saveButton = $('#save');

    saveButton.html('Saving...');
    saveButton.prop('disabled', true);

    await window.backgroundSave();

    const now = performance.now();
    if (now - startTime < minTime)
        await sleep(minTime - (now-startTime));

    saveButton.html('Saved');
    await sleep(1000);
    saveButton.prop('disabled', false);
    saveButton.html('Save');
};

const buildSpritesJSON = async projectID => {
    const json = [];
    for (const sprite of Sprite.sprites) {
        const spriteJSON = sprite.json();
        
        // deal with scripts
        for (const component of spriteJSON['components']) {
            if (component.type === 'Script') {
                component.path = `https://entropyengine.dev/projects/${projectID}/scripts.js`;
            }
        }

        json.push(spriteJSON);
    }
    return json.map(JSON.stringify).join(',\n');
};

function buildScenesJSON () {
    const scenes = [];
    
    for (let scene of Scene.scenes) {
        scenes.push(scene.json());
    }
    
    return scenes.map(JSON.stringify).join(',\n');
}

// just combines all the scripts into a string string
const buildScriptsJS = scripts => {
    let file = `
    import { v2, JSBehaviour } from '../../entropy-engine/index.js';
    import * as ee from '../../entropy-engine/index.js';
    `;

    for (let name in scripts)
        file += `\n${scripts[name]}`;

    return file;
};