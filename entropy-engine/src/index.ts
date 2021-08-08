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
import {System} from "./ECS/system.js";

import './systems/physics/physics.js';
import './systems/rendering/renderer.js';
import './systems/entities/entityController.js';
import {init} from "./scripting/EEScript/index.js";

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
export {System} from './ECS/system.js';

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
// keep as function(){} due to use of 'this'
// @ts-ignore
Number.prototype.clamp = function(min: number, max: number) {
    return Math.min(Math.max(this as number, min), max);
};

export default function entropyEngine ({
    licenseKey = '',
    canvasID= "canvas",
    performanceDebug = 0,
}) {

    // for the event listeners
    let isInitialised = false;

    const licenseLevel = license(licenseKey);
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

        Scene.activeScene.findMainCamera();

        System.Start(Scene.activeScene);

        // for event listeners
        isInitialised = true;
    }

    async function tick () {
        System.Update(Scene.activeScene);
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

export async function runFromJSON (path: string, config: any = {}) {

    init();

    // get and init the
    const data_: any = await fetch(path, scriptFetchInit);
    const data = await data_.json();

    for (let key in data) {
        if (['entities', 'scenes'].includes(key))
            continue;

        config[key] = data[key];
    }

    initialiseScenes(data['scenes']);

    const returns = entropyEngine(config);
    
    await entitiesFromJSON(data['entities']);

    await returns.run();

    return returns;
}