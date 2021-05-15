import {Camera} from './camera.js';
import {Sprite} from './sprite.js';
import {worldSpaceToScreenSpace, screenSpaceToWorldSpace, getCanvasSize} from './util.js';
import {circle, rect} from './renderer.js';
import {v2} from './maths.js';
import {CircleCollider, Collider, RectCollider } from './collisions.js';
import { Transform } from './component.js';

function getGlobalGrid (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Sprite) {
    const zoom = camera.getComponent<Camera>('Camera').zoom;
    const canvasSize = getCanvasSize(canvas);

    // find nearest order of magnitude
    var order = Math.floor(Math.log(zoom) / Math.LN10
        + 0.000000001); // because float math sucks like that
    const zoomToNeartestPow = Math.pow(10,order);
    let step = (1/zoomToNeartestPow) * 50;

    const min = screenSpaceToWorldSpace(new v2(0, 0), camera, canvas);
    const max = screenSpaceToWorldSpace(canvasSize, camera, canvas);

    if ((max.x - min.x) / step < 5)
        step /= 2;

    const roundTo = (x: number) => {
        return Math.ceil(x/step)*step;
    };

    min.apply(roundTo);
    max.apply(roundTo);
    
    return {
        step, min, max, zoom
    }
}

function renderGlobalGrid (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Sprite, colour: string) {
    const {step, min, max} = getGlobalGrid(ctx, canvas, camera);
    const canvasSize = getCanvasSize(canvas);
    
    // horizontal
    for (let y = min.y; y < max.y; y += step) {
        const pos = worldSpaceToScreenSpace(new v2(0, y), camera, canvas);
        pos.x = -1;
        rect(ctx, pos, canvasSize.x+2, 1, colour);
    }

    // vertical
    for (let x = min.x; x < max.x; x += step) {
        const pos = worldSpaceToScreenSpace(new v2(x, 0), camera, canvas);
        pos.y = -1;
        rect(ctx, pos, 1, canvasSize.y+2, colour);
    }
}

function renderGridDots (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Sprite, colour: string, r: number) {
    const {step, min, max} = getGlobalGrid(ctx, canvas, camera);
    
    for (let x = min.x; x < max.x; x += step) {
        for (let y = min.y; y < max.y; y += step) {
            const pos = worldSpaceToScreenSpace(new v2(x, y), camera, canvas);
            circle(ctx, pos, r, colour);
        }
    }
}

function renderCenterDot (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Sprite, colour: string, r: number) {
    const pos = worldSpaceToScreenSpace(v2.zero, camera, canvas);
    circle(ctx, pos, r, colour);
}

function renderCollider (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Sprite, colour: string, collider: Collider, transform: Transform) {
    const zoom = camera.getComponent<Camera>('Camera').zoom;

    ctx.beginPath();
    ctx.strokeStyle = colour;
    
    const pos = worldSpaceToScreenSpace(
        transform.position.clone
            .add(collider.offset),
        camera, canvas
    );

    if (collider instanceof RectCollider) {
        const dimensions = transform.scale.clone.mul(new v2(collider.width, collider.height));
        dimensions.scale(zoom);
        ctx.rect(pos.x, pos.y, dimensions.x, dimensions.y);

    } else if (collider instanceof CircleCollider) {
        ctx.arc(pos.x, pos.y, collider.radius * transform.scale.x * zoom, 0,2*Math.PI);
    }
    ctx.stroke();
}

function renderColliders (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Sprite, colour: string, sprites: Sprite[]) {
    for (const sprite of sprites) {
        if (!sprite.hasComponent('Collider')) continue;
        const collider = sprite.getComponent<Collider>('Collider');
        renderCollider(ctx, canvas, camera, colour, collider, sprite.transform);
    }
}

export function renderDebug (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: Sprite, sprites: Sprite[]) {
    renderGlobalGrid(ctx, canvas, camera,  `rgba(150, 150, 150, 0.3)`);
    renderGridDots(ctx, canvas, camera,  `rgba(150, 150, 150, 0.4)`, 1);
    renderCenterDot(ctx, canvas, camera,  `rgba(150, 150, 150, 0.6)`, 2);
    renderColliders(ctx, canvas, camera, `rgba(255, 230, 0, 0.6)`, sprites)
}