var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Sprite } from "./sprite.js";
import { setCanvasSize, startAnimation } from "./renderer.js";
import renderAll from "./renderComponents.js";
import { Script, scriptManager } from "./scripts.js";
import { v2 } from './maths.js';
import { collideAll } from "./collisions.js";
import { license } from "./license.js";
import { getMousePos, input, setMousePos } from "./input.js";
import { spritesFromJSON } from './JSONprocessor.js';
import { Camera } from "./camera.js";
import { getCanvasStuff } from "./util.js";
export { Sprite } from "./sprite.js";
export { Script, JSBehaviour } from "./scripts.js";
export { CircleCollider, RectCollider } from './collisions.js';
export { v2, Triangle, Mesh } from './maths.js';
export { Body, PhysicsMaterial } from "./physics.js";
export { CircleRenderer, RectRenderer, ImageRenderer } from './renderComponents.js';
export { Presets } from './presets.js';
export { GUIBox, GUIText, GUITextBox, GUIRect, GUICircle, GUIPolygon, GUIImage } from './gui.js';
export { input } from './input.js';
export { Camera } from './camera.js';
export { spritesFromJSON } from './JSONprocessor.js';
export { Transform } from './component.js';
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
// @ts-ignore
Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};
export default function entropyEngine({ licenseKey = '', canvasID = "canvas", width = 1024, height = 512, performanceDebug = 0, }) {
    // for the event listeners
    let isInitialised = false;
    const licenseLevel = license(licenseKey);
    // canvas stuff
    let [passedWidth, passedHeight] = [width, height];
    [width, height] = setCanvasSize(canvasID, width, height);
    const { canvas, ctx } = getCanvasStuff(canvasID);
    // make the Y axis go up rather than down - bit more intuitive
    ctx.transform(1, 0, 0, -1, 0, canvas.height);
    // for easy restoring
    ctx.save();
    const background = {
        colour: 'rgb(255, 255, 255)',
        image: ''
    };
    // managers and constants
    canvas.addEventListener('mousemove', (evt) => {
        if (!isInitialised)
            return;
        setMousePos(evt, canvas);
        Sprite.loopThroughSprites(sprite => {
            for (const component of sprite.components) {
                if (component.type !== 'GUIElement')
                    return;
                const component_ = component;
                component_.hovered = component_.touchingPoint(input.cursorPosition, ctx, sprite.transform);
            }
        });
    }, false);
    canvas.addEventListener('mousedown', (evt) => {
        if (!isInitialised)
            return;
        input.mouseDown = true;
        setMousePos(evt, canvas);
        scriptManager.loopThroughScripts((script, sprite) => {
            if (!sprite.hasComponent('Collider'))
                return;
            let collider = sprite.getComponent('Collider');
            const mousePos = getMousePos(canvas, evt);
            if (!collider.overlapsPoint(sprite.transform, mousePos))
                return;
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
        if (!isInitialised)
            return;
        input.mouseDown = false;
        setMousePos(evt, canvas);
        scriptManager.loopThroughScripts((script, sprite) => {
            if (sprite.hasComponent('Collider')) {
                let collider = sprite.getComponent('Collider');
                const mousePos = getMousePos(canvas, evt);
                if (!collider.overlapsPoint(sprite.transform, mousePos))
                    return;
                script.runMethod('onMouseUp', []);
            }
            else if (sprite.hasComponent('GUIElement')) {
                const ui = sprite.getComponent('GUIElement');
                if (ui.hovered)
                    script.runMethod('onClick', []);
                if (ui.subtype !== 'GUITextBox')
                    return;
                // sets it to be selected if it is being hovered over,
                // and not selected if it is not hovered over
                let ui_ = ui;
                ui_.selected = ui_.hovered;
            }
        });
    }, false);
    function run() {
        return __awaiter(this, void 0, void 0, function* () {
            function init() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (licenseLevel < 2)
                        yield startAnimation(canvasID);
                    Camera.findMain();
                    // scripts start running their own start methods now
                    Script.runStartMethodOnInit = true;
                    scriptManager.runStartAll();
                    // for event listeners
                    isInitialised = true;
                });
            }
            function tick(timestamp) {
                return __awaiter(this, void 0, void 0, function* () {
                    //console.log(`___`);
                    let initTime = timestamp;
                    Sprite.loopThroughSprites(sprite => {
                        sprite.tick();
                        if (sprite.hasComponent('Body'))
                            sprite.getComponent('Body').applyGravity(Sprite.sprites, 10);
                    });
                    if (performanceDebug > 1)
                        console.log(`tick sprite and gravity: ${performance.now() - initTime}`);
                    let time = performance.now();
                    collideAll(Sprite.sprites, scriptManager.collide);
                    if (performanceDebug > 1)
                        console.log(`collisions: ${performance.now() - time}`);
                    time = performance.now();
                    renderAll(Sprite.sprites, canvas, ctx, new v2(width, height), background);
                    if (performanceDebug > 1)
                        console.log(`rendering: ${performance.now() - time}`);
                    if (performanceDebug > 0)
                        console.log(`${performanceDebug > 1 ? 'Total:' : ''}${performance.now() - initTime}`);
                    window.requestAnimationFrame(tick);
                });
            }
            // driver code
            yield init();
            window.requestAnimationFrame(tick);
        });
    }
    return {
        run,
        width,
        height,
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
export function runFromJSON(path, config = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        // get and init the
        const data_ = yield fetch(path, scriptFetchInit);
        const data = yield data_.json();
        for (let key in data) {
            if (key === 'sprites')
                continue;
            config[key] = data[key];
        }
        const returns = entropyEngine(config);
        yield spritesFromJSON(data['sprites']);
        yield returns.run();
        return returns;
    });
}
