import { Sprite, v2, Camera } from "../entropy-engine";
import renderAll from "../entropy-engine/renderComponents.js";
import {rect} from "../entropy-engine/renderer.js";
import {renderDebug} from '../entropy-engine/debugRenderer.js';
import {circle} from '../entropy-engine/renderer.js';
import {screenSpaceToWorldSpace} from '../entropy-engine/util.js';

import {
    ctx, background, canvas,
    setSelected,
    state, scriptEditor, sceneView, gameView, setState, assets,
    sceneCamera
} from "./index.js";

import {reRenderHierarchy} from "./renderHierarchy.js";
import {reRenderInspector} from "./renderInspector.js";
import {renderScripts} from "./renderScript.js";
import {renderAssets} from './renderAssets.js';
import {renderSceneMenu} from './renderSceneMenu.js';

export function showPopUpMenu (event, content) {
    setTimeout(() => {
        const menu = $('#pop-up');

        menu.css('visibility', 'visible');
        menu.css('top', `${event.clientY}px`);
        menu.css('left', `${event.clientX}px`);

        $('#pop-up-content').html(content);

    }, 0);
}

export function setRightClick (elementID, selectSprite, content) {
    const sprite_ = selectSprite;
    document.getElementById(elementID)?.addEventListener('contextmenu', event => {
        console.log(elementID, content);
        setSelected(sprite_);
        reRender();
        showPopUpMenu(event, content);
        event.preventDefault();
    }, false);
}


export function rightClickOption (name, onclick, show=name) {
    window[`rightclick-${name}`] = onclick;

    return (`
        <div>
            <button 
                class="empty-button" 
                onclick="window['rightclick-${name}']()"
                style="
                    border-radius: 5px;
                    width: 100%;
                    background-color: var(--transparent);
                "
            ">
                ${show}
            </button>
        </div>
    `);
}

export function reRenderCanvas () {
    renderAll(Sprite.sprites, canvas, ctx, background);
}

export function reRenderCanvasDebug () {
    renderDebug(canvas, ctx, sceneCamera, Sprite.sprites);
}

const canvasDIV = $('#canvas');
const sceneToolbar = $('#scene-toolbar');
const scriptsDIV = $('#scripts');
const assetsDIV = $('#assets');
const scriptsButton = $(`#go-to-scripts-button`);
const sceneButton = $(`#go-to-scene-button`);
const gameButton = $('#go-to-game-button');
const assetButton = $('#go-to-assets-button');

export function reRenderSceneToolbar () {
    renderSceneMenu(sceneToolbar);
}

export function reRender () {
    console.log('..........');

    function setTabNotActive (tab, div) {
        tab.hover(() => {
            tab.css('background-color', 'var(--input-hover-bg)');
        }, () => {
            tab.css('background-color', 'var(--input-opposite-bg)');
        });

        tab.css('background-color', 'var(--input-opposite-bg)');
        tab.css('border-bottom', 'none');
        div.css('display', 'none');
    }

    function setTabActive (tab, div, useInLineDisplay=false) {
        tab.hover(() => {
            tab.css('background-color', 'var(--input-hover-bg)');
        }, () => {
            tab.css('background-color', 'var(--input-bg)');
        });

        tab.css('background-color', 'var(--input-bg)');
        tab.css('border-bottom', '3px sold blue');
        div.css('display', useInLineDisplay? 'inline':'flex');
    }

    sceneToolbar.css('height', '0');
    if (state !== sceneView)
        sceneToolbar.html('');

    switch (state) {
        case sceneView:
            setTabNotActive(scriptsButton, scriptsDIV);
            setTabNotActive(gameButton, canvasDIV);
            setTabActive(sceneButton, canvasDIV, true);
            setTabNotActive(assetButton, assetsDIV);

            Camera.main = sceneCamera;

            reRenderCanvas();
            reRenderCanvasDebug();

            reRenderHierarchy();
            reRenderInspector();
            reRenderSceneToolbar();
            
            sceneToolbar.css('height', '30px');
            break;

        case scriptEditor:
            setTabNotActive(sceneButton, canvasDIV);
            setTabActive(scriptsButton, scriptsDIV);
            setTabNotActive(gameButton, canvasDIV);
            setTabNotActive(assetButton, assetsDIV);

            rect(ctx, v2.zero, canvas.width, canvas.height, `rgb(255, 255, 255)`);
            reRenderHierarchy();
            reRenderInspector();
            renderScripts('scripts');
            break;

        case gameView:
            Camera.findMain();

            setTabNotActive(sceneButton, canvasDIV);
            setTabNotActive(scriptsButton, scriptsDIV);
            setTabActive(gameButton, canvasDIV, true);
            setTabNotActive(assetButton, assetsDIV);

            reRenderCanvas();
            
            reRenderHierarchy();
            reRenderInspector();
            break;

        case assets:
            
            setTabNotActive(sceneButton, canvasDIV);
            setTabNotActive(scriptsButton, scriptsDIV);
            setTabNotActive(gameButton, canvasDIV);
            setTabActive(assetButton, assetsDIV, true);
            
            renderAssets(assetsDIV);
            break;

        default:
            setState(sceneView);
            reRender();
            break;
    }


    /* shows dots in places where if you click there you wouldn't select anything

    for (let x = 0; x < 1000; x += 5) {
        for (let y = 0; y < 1100; y += 5) {
            const pos = screenSpaceToWorldSpace(new v2(x, y), sceneCamera, canvas);
            let touching = 0;
            Sprite.loopThroughSprites(sprite => {
                for (const component of sprite.components) {
                    if (component.type === 'GUIElement')
                        if (component.touchingPoint(pos, ctx, sprite.transform))
                            touching++;

                    if (component.type === 'Collider')
                        if (component.overlapsPoint(sprite.transform, pos))
                            touching++;
                }
            });

            if (touching === 0)
                circle(ctx, new v2(x, y), 1, 'rgb(0, 255, 0)');
        }
    }
     */

}