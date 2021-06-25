import {
    state,
    ctx,
    canvas,
    setState,
    gameView,
    projectID,
    setSelected
} from "./state.js";

import {reRender, reRenderCanvas, reRenderCanvasDebug, reRenderSceneToolbar} from "./render/renderer.js";
import {rect} from "../entropy-engine/render/renderer.js";
import {loopThroughScripts, screenSpaceToWorldSpace} from '../entropy-engine/util/util.js';
import {v2, Sprite, Scene, Camera} from '../entropy-engine';
import {genCacheBust} from '../util.js';
import {getMousePos} from "../entropy-engine/util/input.js";

window.addEventListener('click', () => {
    $('#pop-up').css('visibility', 'hidden');

    // cleans up add-component window
    // in timeout just to make sure it gets the click if you clicked on a button in the menu first
    const popup = $('.add-component-popup');
    
    if (!popup.length) return;
    
    popup.remove();
});

document.addEventListener('contextmenu', event => {
    $('#pop-up').css('visibility', 'hidden');
});

window.onPropertyChange = (id, componentName, componentPropertyChain, parser) => {
    let value = $(`#${id}`).val();


    let component;
    if (componentName === 'nocomponent')
        component = state.selectedSprite;
    else
        component = state.selectedSprite.getComponent(componentName);

    let toChange = component;
    for (let i = 0; i < componentPropertyChain.length-1; i++)
        toChange = toChange[componentPropertyChain[i]];

    if (parser)
        value = parser(value);

    const lastPropertyName = componentPropertyChain [componentPropertyChain.length-1];

    // its an asset
    if (lastPropertyName === 'url')
        value = `https://entropyengine.dev/projects/${projectID}/assets/${value}`;
    
    toChange [lastPropertyName] = value;

    reRender();
};

window.setParent = id => {
    const name = $(`#${id}`).val();
    state.selectedSprite.transform.setParentDirty(window.findNodeWithName(name));

    reRender();
}

$(document).keydown(event => {
        // If Control or Command key is pressed and the S key is pressed
        // run save function. 83 is the key code for S.
        if((event.ctrlKey || event.metaKey) && event.which === 83) {
            window.save();
            event.preventDefault();
            return false;
        }
    }
);

window.run = async () => {
    await window.backgroundSave();

    setState(gameView);
    reRender();

    rect(ctx, v2.zero, canvas.width, canvas.height, `rgb(255, 255, 255)`);

    const playButton = $('#run');

    playButton.css({
        'background': 'none',
        'background-color': 'var(--text-colour)',
        'height': '15px',
        'width': '15px',
        'margin': '2px 35px'
    });

    // if you add another listener then it will run this function before reloading,
    // which saves the project - not good
    document.getElementById('run').onclick = () => {
        window.location.reload();
    };

    $('#save, #build-button, #share').remove();

    const allScripts = await import(`../projects/${projectID}/scripts.js?c=${genCacheBust()}`);

    loopThroughScripts((script, sprite) => {
        const className = script.name || script.scriptName;
        const scriptClass = allScripts[className];
        script.script = new scriptClass();
    });

    state.eeReturns.run();
};

document.getElementById('myCanvas').onwheel = event => {
    event.preventDefault();
    if (state.window !== sceneView) return;

    const cam = state.sceneCamera.getComponent('Camera');
    cam.zoom *= 1 + (event.deltaY * -0.0001);

    cam.zoom = Math.min(Math.max(5*10**-3, cam.zoom), 5*10**2);

    state.sceneCamera.transform.position.z += event.deltaY / 1000;

    reRenderCanvas();
    reRenderCanvasDebug();
    reRenderSceneToolbar();
};

export function setSelectedSpriteFromClick (pos) {
    let touching = [];
    for (let sprite of Scene.activeScene.sprites) {
        for (const component of sprite.components) {
            if (component.type === 'GUIElement')
                if (component.touchingPoint(pos, ctx, sprite.transform))
                    touching.push(sprite);

            if (component.type === 'Collider')
                if (component.overlapsPoint(sprite.transform, pos))
                    touching.push(sprite);
        }
    }

    if (touching.length === 0) {
        setSelected(null);
    } else {
        setSelected(touching[0]);
    }
    reRender();
}

window.goToBuildMenu = async () => {
    await window.backgroundSave();
    window.location.href = `https://entropyengine.dev/editor/build/?p=${projectID}`;
};

// sets the scene from the
window.setScene = () => {
    Scene.active = parseInt($('#scene-select').val()) || 0;
    setSelected(Scene.activeScene.sprites[0]);
    sessionStorage.sceneID = Scene.active;
    reRender();
};

canvas.addEventListener('click', event => {
    if (state.window !== sceneView) return;
    const mousePos = getMousePos(canvas, event);
    const clickPos = screenSpaceToWorldSpace(mousePos, state.sceneCamera, canvas);
    setSelectedSpriteFromClick(clickPos);
});


canvas.addEventListener('mousedown', event => {
    if (event.button !== 2) return;
    state.dragStart = getMousePos(canvas, event);
    state.dragging = true;
});

canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
}, false);

canvas.addEventListener('mouseup', event => {
    if (event.button !== 2) return;
    state.dragging = false;
});

function drag (event) {
    state.dragEnd = getMousePos(canvas, event);
    const diff = state.dragEnd.clone.sub(state.dragStart);

    const camZoom = state.sceneCamera.getComponent('Camera').zoom;

    diff.scale(1/camZoom);
    // reverse to drag naturally in the right direction
    diff.scale(-1);
    state.sceneCamera.transform.localPosition.add(diff.v3);
    state.dragStart = state.dragEnd;

    reRenderCanvas();
    reRenderCanvasDebug();
    reRenderSceneToolbar();
}

canvas.addEventListener('mousemove', evt => {
    if (!Camera.main) return;
    if (state.window !== sceneView) return;

    // update world and screen space values in scene view toolbar

    const screenSpace = getMousePos(canvas, evt);
    const worldSpace = screenSpaceToWorldSpace(screenSpace, state.sceneCamera, canvas);

    const worldSpaceDIV = $('#world-space-pos');
    const screenSpaceDIV = $('#screen-space-pos');

    worldSpaceDIV.html(`
        ${worldSpace.x.toFixed(2)} | ${worldSpace.y.toFixed(2)}
    `);

    screenSpaceDIV.html(`
        ${screenSpace.x.toFixed(2)} | ${screenSpace.y.toFixed(2)}
    `);

    if (state.dragging) drag(event);

}, false);

canvas?.parentNode?.addEventListener('resize', () => {
    reRender();
});

// for type Sprite in the inspector
window.findSpriteWithName = (name) => {
    return Sprite.find(name);
};

// if no sprite is found with that name, then the active scene is used instead
window.findNodeWithName = name => {

    let node = Sprite.find(name)?.transform;

    node ??= Scene.active;

    return node;
};