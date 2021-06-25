import { Scene, v2, Camera } from "../../entropy-engine";
import {renderAll} from "../../entropy-engine/render/renderer.js";
import {rect} from "../../entropy-engine/render/renderer.js";
import {renderDebug, renderSelectedOutline, drawCameraViewArea} from '../../entropy-engine/render/debugRenderer.js';

import {
    ctx, background, canvas,
    setSelected,
    state, scriptEditor, sceneView, gameView, setState, assets, comments,
} from "../state.js";

import {reRenderHierarchy} from "./hierarchy/renderHierarchy.js";
import {reRenderInspector} from "./inspector/renderInspector.js";
import {renderScripts} from "./script-editor/renderScript.js";
import {renderAssets} from './assets/renderAssets.js';
import {renderSceneMenu} from './renderSceneMenu.js';
import {renderComments} from './comments/renderComments.js';

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
                    background-color: vaR(--transparent);
                "
            ">
                ${show}
            </button>
        </div>
    `);
}

export function reRenderCanvas () {
    renderAll(Scene.activeScene.sprites, canvas, ctx, Scene.activeScene.settings.background, Camera.main);;
}

export function reRenderCanvasDebug () {
    renderDebug(canvas, ctx, state.sceneCamera, Scene.activeScene.sprites);

    if (!state.selectedSprite) return;

    renderSelectedOutline(canvas, ctx, state.sceneCamera, state.selectedSprite);

    if (state.selectedSprite.hasComponent('Camera'))
        drawCameraViewArea(ctx, canvas, state.sceneCamera, state.selectedSprite, `rgb(255, 0, 0)`);
}

const canvasDIV = $('#canvas');
const sceneToolbar = $('#scene-toolbar');
const scriptsDIV = $('#scripts');
const assetsDIV = $('#assets');
const commentsDIV = $('#comments');

const scriptsButton = $(`#go-to-scripts-button`);
const sceneButton = $(`#go-to-scene-button`);
const gameButton = $('#go-to-game-button');
const assetButton = $('#go-to-assets-button');
const commentsButton = $('#go-to-comments-button');

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
    if (state.window !== sceneView)
        sceneToolbar.html('');

    switch (state.window) {
        case sceneView:
            setTabNotActive(scriptsButton, scriptsDIV);
            setTabNotActive(gameButton, canvasDIV);
            setTabActive(sceneButton, canvasDIV, true);
            setTabNotActive(assetButton, assetsDIV);
            setTabNotActive(commentsButton, commentsDIV);

            Camera.main = state.sceneCamera;

            reRenderCanvas();
            reRenderCanvasDebug();
            reRenderSceneToolbar();
            
            sceneToolbar.css('height', '30px');
            break;

        case scriptEditor:
            setTabNotActive(sceneButton, canvasDIV);
            setTabActive(scriptsButton, scriptsDIV);
            setTabNotActive(gameButton, canvasDIV);
            setTabNotActive(assetButton, assetsDIV);
            setTabNotActive(commentsButton, commentsDIV);

            rect(ctx, v2.zero, canvas.width, canvas.height, `rgb(255, 255, 255)`);
            renderScripts('scripts');
            break;

        case gameView:
            Scene.activeScene.findMainCamera();

            setTabNotActive(sceneButton, canvasDIV);
            setTabNotActive(scriptsButton, scriptsDIV);
            setTabActive(gameButton, canvasDIV, true);
            setTabNotActive(assetButton, assetsDIV);
            setTabNotActive(commentsButton, commentsDIV);

            reRenderCanvas();

            break;

        case assets:
            
            setTabNotActive(sceneButton, canvasDIV);
            setTabNotActive(scriptsButton, scriptsDIV);
            setTabNotActive(gameButton, canvasDIV);
            setTabActive(assetButton, assetsDIV, true);
            setTabNotActive(commentsButton, commentsDIV);
            
            renderAssets(assetsDIV);

            break;
            
        case comments:

            setTabNotActive(sceneButton, canvasDIV);
            setTabNotActive(scriptsButton, scriptsDIV);
            setTabNotActive(gameButton, canvasDIV);
            setTabNotActive(assetButton, assetsDIV);
            setTabActive(commentsButton, commentsDIV, true);

            renderComments(commentsDIV);
            break;

        default:
            setState(sceneView);
            reRender();
            break;
    }

    reRenderHierarchy();
    reRenderInspector();

}