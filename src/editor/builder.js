import {Entity, Scene} from "../entropy-engine/1.0";
import {scripts, projectID, scriptURLS, apiToken, state} from "./state.js";
import {request} from '../request.ts';
import {sleep} from '../util.ts';

// needed for it to actually import and run this script
export const myExport = 0;

function buildScripts () {
    let scriptReturn = [];
    for (let script in scripts) {
        let path = scriptURLS[script];
        let text = scripts[script];

        if (path === undefined || text === undefined) {
            console.log(scriptURLS);
            console.error(`Cannot find either script path or text for script ${script}. Path: ${path}, text: ${text}`)
            continue;
        }
        scriptReturn.push({path, text});
    }

    return scriptReturn;
}

window.backgroundSave = async () => {
    // raw save, no visible changes
    await request('/save-project', apiToken, {
        scripts: buildScripts(),
        json: `
        {
            "canvasID": "myCanvas",
            "entities": [
                ${await buildSpritesJSON(projectID)}
            ],
            "scenes": [
                ${buildScenesJSON()}
            ]
        }
        `
    });
};

//setInterval(async () => {
    //if (!state.running) await backgroundSave();
//}, 1000);

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
    for (const sprite of Entity.entities) {
        const spriteJSON = sprite.json();
        
        // deal with scripts
        for (const component of spriteJSON['components']) {
            if (component.type === 'Script') {
                component.path = scriptURLS[component.name || component.scriptName];
            }
        }

        json.push(JSON.stringify(spriteJSON));
    }
    return json.join(',\n');
};

function buildScenesJSON () {
    const scenes = [];
    
    for (let scene of Scene.scenes)
        scenes.push(JSON.stringify(scene.json()));
    
    return scenes.join(',\n');
}