import 'https://entropyengine.dev/libraries/matter.js';

import { Entity } from "./ECS/entity.js"
import { startAnimation } from "./systems/rendering/startAnimation.js"
import { Script } from './components/scriptComponent.js'
import {Collider} from './components/colliders.js'
import { license } from "./license.js"
import {getMousePos, input, setMousePos} from "./input.js"
import { GUIElement, GUITextBox } from "./components/gui/gui.js"
import { entitiesFromJSON, initialiseScenes } from './JSONprocessor.js'
import {Camera} from "./components/camera.js"
import {getCanvasStuff, setCanvasSize} from "./util/general.js"
import {rgb} from './util/colour.js'
import {Scene} from './ECS/scene.js'
import {Systems} from "./ECS/system.js";
import {Transform} from "./components/transform.js";
import {RectCollider, CircleCollider} from "./components/colliders.js";
import { v2, TriangleV2, MeshV2, v3, TriangleV3, MeshV3 } from './maths/maths.js'
import { Body } from "./components/body.js"
import { CircleRenderer, RectRenderer, ImageRenderer2D, MeshRenderer } from './components/renderComponents.js'
import { GUIBox, GUIText, GUIRect, GUICircle, GUIPolygon, GUIImage } from './components/gui/gui.js'

import {init as initEES} from "./scripting/EEScript/index.js";
import {globalConstants} from "./scripting/EEScript/constants.js";

import './systems/physics/physics.js';
import './systems/rendering/renderer.js';
import './systems/entities/entityController.js';

export {rgb} from './util/colour.js'
export { Entity } from "./ECS/entity.js"
export {Script} from './components/scriptComponent.js'
export { CircleCollider, RectCollider } from './components/colliders.js'
export { v2, TriangleV2, MeshV2, v3, TriangleV3, MeshV3 } from './maths/maths.js'
export { Body } from "./components/body.js"
export { CircleRenderer, RectRenderer, ImageRenderer2D, MeshRenderer } from './components/renderComponents.js'
export { GUIBox, GUIText, GUITextBox, GUIRect, GUICircle, GUIPolygon, GUIImage } from './components/gui/gui.js'
export { input } from './input.js'
export { Camera } from './components/camera.js'
export { entitiesFromJSON } from './JSONprocessor.js'
export {Transform} from './components/transform.js'
export {Scene} from './ECS/scene.js'
export {Systems} from './ECS/system.js';

// setup the global constants for entropy script
globalConstants['CircleCollider'] = CircleCollider;
globalConstants['RectCollider'] = RectCollider;
globalConstants['Script'] = Script;
globalConstants['TriangleV2'] = TriangleV2;
globalConstants['TriangleV3'] = TriangleV3;
globalConstants['MeshV2'] = MeshV2;
globalConstants['MeshV3'] = MeshV3;
globalConstants['Body'] = Body;
globalConstants['CircleRenderer'] = CircleRenderer;
globalConstants['RectRenderer'] = RectRenderer;
globalConstants['ImageRenderer2D'] = ImageRenderer2D;
globalConstants['MeshRenderer'] = MeshRenderer;
globalConstants['GUIBox'] = GUIBox;
globalConstants['GUIText'] = GUIText;
globalConstants['GUITextBox'] = GUITextBox;
globalConstants['GUIRect'] = GUIRect;
globalConstants['GUICircle'] = GUICircle;
globalConstants['GUIPolygon'] = GUIPolygon;
globalConstants['GUIImage'] = GUIImage;
globalConstants['Camera'] = Camera;
globalConstants['Transform'] = Transform;

Number.prototype.clamp = function (min: number, max: number) {
    return Math.min(Math.max(this as number, min), max);
};

/**
 * Initialises Entropy Engine
 * @param {string} [canvasID="canvas"] ID of the canvas HTML element being drawn to
 * @param {number} [performanceDebug=0] Level of timings logged to JS console
 * @param {boolean} [shouldInitEES=true] Only set to false if Entropy Engine Script has already been initialised
 * @returns {object} Contains run function which starts the game loop
 */
export default function entropyEngine ({
    canvasID= "canvas",
    performanceDebug = 0,
    shouldInitEES = true
}) {

    // for the event listeners
    let isInitialised = false;

    const licenseLevel = license('');
    const { canvas, ctx } = getCanvasStuff(canvasID);
    
    setCanvasSize(canvas);
    
    canvas?.parentNode?.addEventListener('resize', () => {
        // TO-DO: this doesn't work
        setCanvasSize(canvas);
    });

    
    // make the Y axis go up rather than down - bit more intuitive
    ctx.transform(1, 0, 0, -1, 0, canvas.height);
    // for easy restoring
    ctx.save();

    // managers and constants
    canvas.addEventListener('mousemove', (evt: any) => {
        if (!isInitialised) return;

        setMousePos(evt, canvas);

        Entity.loop(sprite => {
            if (!(sprite.sceneID === Scene.active)) return;
            
            for (const component of sprite.components) {
                if (component.type !== 'GUIElement') return;

                const component_ = (<unknown>component) as GUIElement;
                component_.hovered = component_.touchingPoint(input.cursorPosition, ctx, sprite.transform);
            }
        });
    }, false);

    canvas.addEventListener('mousedown', (evt: any) => {
        if (!isInitialised) return;
        input.mouseDown = true;

        setMousePos(evt, canvas);

        Scene.activeScene.loopThroughScripts((script, sprite) => {
            if (!(sprite.sceneID === Scene.active)) return;
            if (!sprite.hasComponent('Collider')) return;

            let collider = sprite.getComponent<Collider>('Collider');
            const mousePos = getMousePos(canvas, evt);

            if (!collider.overlapsPoint(sprite.transform, mousePos)) return;

            script.runMethod('onMouseDown', []);
        });
    }, false);

    canvas.addEventListener('keydown', (event) => {
        setMousePos(event, canvas);
    });
    canvas.addEventListener('keyup', (event) => {
        setMousePos(event, canvas);
    });

    canvas.addEventListener('mouseup', (evt) => {
        if (!isInitialised) return;

        input.mouseDown = false;
        setMousePos(evt, canvas);

        Scene.activeScene.loopThroughScripts((script, sprite) => {
            if (!(sprite.sceneID === Scene.active)) return;
            if (sprite.hasComponent('Collider')){

                let collider = sprite.getComponent<Collider>('Collider');
                const mousePos = getMousePos(canvas, evt);

                if (!collider.overlapsPoint(sprite.transform, mousePos)) return;

                script.runMethod('onMouseUp', []);

            } else if (sprite.hasComponent('GUIElement')) {
                const ui = sprite.getComponent<GUIElement>('GUIElement');
                if (ui.hovered)
                    script.runMethod('onClick', []);

                if (ui.subtype !== 'GUITextBox') return;

                // sets it to be selected if it is being hovered over,
                // and not selected if it is not hovered over
                let ui_ = ui as GUITextBox;
                ui_.selected = ui_.hovered;
            }
        });
    }, false);

    async function init () {

        if (licenseLevel < 2)
            await startAnimation(canvasID);

        if (shouldInitEES)
            initEES();

        Scene.activeScene.findMainCamera();

        Systems.Start(Scene.activeScene);

        // for event listeners
        isInitialised = true;
    }

    async function tick () {
        Systems.Update(Scene.activeScene);
        window.requestAnimationFrame(tick);
    }

    async function run () {
        await init();
        window.requestAnimationFrame(tick);
    }

    return {run};
}

// cache busting
const scriptFetchHeaders = new Headers();
scriptFetchHeaders.append('pragma', 'no-cache');
scriptFetchHeaders.append('cache-control', 'no-cache');

const scriptFetchInit = {
    method: 'GET',
    headers: scriptFetchHeaders,
};

/**
 * Initialise and run Entropy Engine from the URL of a JSON file
 * @param {string} path - path to JSON file
 * @param {object} config - passed to entropyEngine function
 */
export async function runFromJSON (path: string, config: any = {}) {

    initEES();

    // get and init the
    const data_: any = await fetch(path, scriptFetchInit);
    const data = await data_.json();

    for (let key in data) {
        if (['entities', 'scenes'].includes(key))
            continue;

        config[key] = data[key];
    }

    config.shouldInitEES = false;

    initialiseScenes(data['scenes']);

    const returns = entropyEngine(config);
    
    await entitiesFromJSON(data['entities']);

    await returns.run();

    return returns;
}