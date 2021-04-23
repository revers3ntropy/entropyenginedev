import { Sprite, v2 } from "./entropy-engine";

import renderAll from "./entropy-engine/renderComponents.js";
import {rect} from "./entropy-engine/renderer.js";

import {
    ctx, background, width, height, canvas,
    setSelected,
    state, scriptEditor, sceneView, setState
} from "./index.js";

import {reRenderHierarchy} from "./renderHierarchy.js";
import {reRenderInspector} from "./renderInspector.js";
import {renderScripts} from "./renderScript.js";

export function showPopUpMenu (event, content) {
    setTimeout(() => {
        const menu = $('#pop-up');

        menu.css('visibility', 'visible');
        menu.css('top', `${event.clientY}px`);
        menu.css('left', `${event.clientX}px`);

        menu.html(content);

    }, 0);
}

export function setRightClick (elementID, sprite, content) {
    const sprite_ = sprite;
    document.getElementById(elementID)?.addEventListener('contextmenu', event => {
        setSelected(sprite_);
        reRender();
        showPopUpMenu(event, content);
        event.preventDefault();
    }, false);
}

export function rightClickOption (name, onclick) {
    window[`rightclick${name}`] = onclick;

    return (`
        <div>
            <button 
                class="empty-button" 
                onclick="window.rightclick${name}()"
                style="
                    border-radius: 5px;
                    width: 100%
                "
            ">
                ${name}
            </button>
        </div>
    `);
}

export function reRender () {
    console.log('..........');

    const canvasDIV = $('#canvas');
    const scriptsDIV = $('#scripts');
    const scriptsButton = $(`#go-to-scripts-button`);
    const sceneButton = $(`#go-to-scene-button`);

    switch (state) {
        case sceneView:
            canvasDIV.css('visibility', 'visible');
            scriptsDIV.css('visibility', 'hidden');
            scriptsDIV.html('');

            scriptsButton.hover(() => {
                scriptsButton.css('background-color', 'var(--input-hover-bg)');
            }, () => {
                scriptsButton.css('background-color', 'var(--input-opposite-bg)');
            });
            sceneButton.hover(() => {
                sceneButton.css('background-color', 'var(--input-hover-bg)');
            }, () => {
                sceneButton.css('background-color', 'var(--input-bg)');
            });
            sceneButton.css('background-color', 'var(--input-bg)');
            scriptsButton.css('background-color', 'var(--input-opposite-bg)');

            renderAll(Sprite.sprites, canvas, ctx, new v2(width, height), background);
            reRenderHierarchy();
            reRenderInspector();
            break;

        case scriptEditor:
            canvasDIV.css('visibility', 'hidden');
            scriptsDIV.css('visibility', 'visible');

            scriptsButton.hover(() => {
                scriptsButton.css('background-color', 'var(--input-hover-bg)');
            }, () => {
                scriptsButton.css('background-color', 'var(--input-bg)');
            });
            sceneButton.hover(() => {
                sceneButton.css('background-color', 'var(--input-hover-bg)');
            }, () => {
                sceneButton.css('background-color', 'var(--input-opposite-bg)');
            });
            scriptsButton.css('background-color', 'var(--input-bg)');
            sceneButton.css('background-color', 'var(--input-opposite-bg)');

            rect(ctx, v2.zero, canvas.width, canvas.height, `rgb(255, 255, 255)`);
            renderScripts('scripts');
            break;

        default:
            setState(sceneView);
            break;
    }

}