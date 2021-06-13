import { Sprite } from "./ECS/sprite.js"
import { setCanvasSize, startAnimation } from "./render/renderer.js"
import {renderAll} from "./render/renderer.js"
import { Script } from './ECS/components/scriptComponent.js'
import { collideAll} from "./physics/collisions.js"
import {Collider} from './ECS/components/colliders.js'
import { license } from "./util/license.js"
import {getMousePos, input, setMousePos} from "./util/input.js"
import { GUIElement, GUITextBox } from "./ECS/components/gui.js"
import { spritesFromJSON, initialiseScenes } from './util/JSONprocessor.js'
import {Camera} from "./ECS/components/camera.js"
import {getCanvasStuff, loopThroughScripts} from "./util/util.js"
import {rgb} from './util/colour.js'
import {Scene} from './ECS/scene.js'

export {rgb} from './util/colour.js'
export { Sprite } from"./ECS/sprite.js"
export {Script} from './ECS/components/scriptComponent.js'
export { CircleCollider, RectCollider } from './ECS/components/colliders.js'
export { v2, TriangleV2, MeshV2, v3, TriangleV3, MeshV3 } from './util/maths/maths.js'
export { Body } from "./physics/body.js"
export { CircleRenderer, RectRenderer, ImageRenderer2D } from './ECS/components/renderComponents.js'
export { GUIBox, GUIText, GUITextBox, GUIRect, GUICircle, GUIPolygon, GUIImage } from './ECS/components/gui.js'
export { input } from './util/input.js'
export { Camera } from './ECS/components/camera.js'
export { spritesFromJSON } from './util/JSONprocessor.js'
export {Transform} from './ECS/transform.js'
export {worldSpaceToScreenSpace, screenSpaceToWorldSpace} from './util/util.js'
export {JSBehaviour} from './scripting/scripts.js'
export {Scene} from './ECS/scene.js'

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

    const background = {
        colour: rgb(255, 255, 255),
        image: ''
    };

    // managers and constants
    canvas.addEventListener('mousemove', (evt: any) => {
        if (!isInitialised) return;

        setMousePos(evt, canvas);

        Sprite.loop(sprite => {
            if (!sprite.active) return;
            
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

        loopThroughScripts((script, sprite) => {
            if (!sprite.active) return;
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

        loopThroughScripts((script, sprite) => {
            if (!sprite.active) return;
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

        Camera.findMain();

        // scripts start running their own start methods now
        Script.runStartMethodOnInit = true;

        loopThroughScripts((script: Script, sprite: Sprite) => {
            script.script?.Start_(sprite);
            script.runMethod('Start', []);
        });

        // for event listeners
        isInitialised = true;
    }

    async function tick (timestamp: number) {

        let initTime = timestamp;
        
        Sprite.loop(sprite => {            
            if (!sprite.active) return;
            sprite.tick();
        });
        
        if (performanceDebug > 1)
            console.log(`tick sprite and gravity: ${performance.now() - initTime}`);

        let time = performance.now();
        collideAll(Scene.activeScene.sprites, (sprite1, sprite2) => {
            for (let component of sprite1.components)
                if (component.type === 'Script')
                    (component as Script).runMethod('onCollision', [sprite2]);


            for (let component of sprite2.components)
                if (component.type === 'Script')
                    (component as Script).runMethod('onCollision', [sprite1]);
        });
        if (performanceDebug > 1)
            console.log(`collisions: ${performance.now() - time}`);

        time = performance.now();
        renderAll(Scene.activeScene.sprites, canvas, ctx, background);
        if (performanceDebug > 1)
            console.log(`rendering: ${performance.now() - time}`);

        if (performanceDebug > 0)
            console.log(`${performanceDebug > 1 ? 'Total:' : ''}${performance.now() - initTime}`);

        window.requestAnimationFrame(tick);
    }

    async function run () {
        await init();
        window.requestAnimationFrame(tick);
    }

    return {
        run,
        background
    };
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

    // get and init the
    const data_: any = await fetch(path, scriptFetchInit);
    const data = await data_.json();

    for (let key in data) {
        if (['sprites', 'scenes'].includes(key))
            continue;

        config[key] = data[key];
    }

    initialiseScenes(data['scenes']);

    const returns = entropyEngine(config);
    
    await spritesFromJSON(data['sprites']);

    await returns.run();

    return returns;
}