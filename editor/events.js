import {
    selectedSprite,
    eeReturns,
    ctx,
    canvas,
    setState,
    gameView,
    projectID,
    sceneCamera,
    setSelected
} from "./index.js";

import {reRender} from "./renderer.js";
import {rect} from "../entropy-engine/renderer.js";
import {v2, Sprite} from '../entropy-engine';
import {scriptManager} from '../entropy-engine/scripts.js';
import {genCacheBust} from '../util.js';

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

    console.log(id, componentName, componentPropertyChain);

    let component;
    if (componentName === 'nocomponent') {
        component = selectedSprite;
    } else
        component = selectedSprite.getComponent(componentName);

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

$(document).keydown(event => {
        // If Control or Command key is pressed and the S key is pressed
        // run save function. 83 is the key code for S.
        if((event.ctrlKey || event.metaKey) && event.which == 83) {
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
    playButton.click(() => {
        window.location.reload();
    });

    $('#save, #build-button, #share').remove();

    const allScripts = await import(`../projects/${projectID}/scripts.js?c=${genCacheBust()}`);

    scriptManager.loopThroughScripts((script, sprite) => {
        const className = script.name || script.scriptName;
        const scriptClass = allScripts[className];
        script.script = new scriptClass();
    });

    eeReturns.run();
};

document.getElementById('myCanvas').onwheel = event => {
    event.preventDefault();
    const cam = sceneCamera.getComponent('Camera');
    cam.zoom *= 1 + (event.deltaY * -0.0001);

    cam.zoom = Math.min(Math.max(5*10**-3, cam.zoom), 5*10**2);
    
    reRender();
};

export function setSelectedSpriteFromClick (pos) {
    let touching = [];
    Sprite.loopThroughSprites(sprite => {
        for (const component of sprite.components) {
            if (component.type === 'GUIElement')
                if (component.touchingPoint(pos, ctx, sprite.transform))
                    touching.push(sprite);

            if (component.type === 'Collider')
                if (component.overlapsPoint(sprite.transform, pos))
                    touching.push(sprite);
        }
    });

    if (touching.length === 0) return;
    else if (touching.length === 1) {
        setSelected(touching[0]);
        reRender();
        return;
    }
}

window.goToBuildMenu = async () => {
    await window.backgroundSave();
    window.location.href = `https://entropyengine.dev/editor/build/?p=${projectID}`;
};