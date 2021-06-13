import {Camera} from '../ECS/components/camera.js';
import {Sprite} from '../ECS/sprite.js';
import {worldSpaceToScreenSpace, screenSpaceToWorldSpace, getCanvasSize} from '../util/util.js';
import {circle, rect, image} from './renderer.js';
import {v2} from '../util/maths/maths.js';
import {CircleCollider, RectCollider, Collider } from '../ECS/components/colliders.js';

import { Transform } from '../ECS/transform.js';

function getGlobalGrid (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Sprite) {
    const zoom = camera.getComponent<Camera>('Camera').zoom;
    const canvasSize = getCanvasSize(canvas);

    // find nearest order of magnitude
    var order = Math.floor(Math.log(zoom) / Math.LN10
        + 0.000000001); // because float math sucks like that
    const zoomToNearestPow = Math.pow(10,order);
    let step = (1/zoomToNearestPow) * 50;

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
        transform.position.clone.v2
            .add(collider.offset),
        camera, canvas
    );

    if (collider instanceof RectCollider) {
        const dimensions = transform.scale.v2.mul(new v2(collider.width, collider.height));
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

export function drawCameras (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Sprite, sprites: Sprite[]) {
    for (const sprite of sprites) {
        if (!sprite.hasComponent('Camera')) continue;
        let pos = worldSpaceToScreenSpace(sprite.transform.position.v2, camera, canvas);
        image(ctx, pos, new v2(80, 40), 'https://entropyengine.dev/svg/camera.png');
    }
}

export function drawCameraViewArea (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Sprite, cameraToDraw: Sprite, colour: string) {
    const canvasSize = getCanvasSize(canvas);

    const min = screenSpaceToWorldSpace(new v2(0, 0), cameraToDraw, canvas);
    const max = screenSpaceToWorldSpace(canvasSize, cameraToDraw, canvas);
    
    const minScreenSpace = worldSpaceToScreenSpace(min, camera, canvas);
    const maxScreenSpace = worldSpaceToScreenSpace(max, camera, canvas);

    const ySize = Math.abs(minScreenSpace.y - maxScreenSpace.y);
    const xSize = Math.abs(minScreenSpace.x - maxScreenSpace.x);

    // left and right
    rect(ctx, minScreenSpace, 1, ySize, colour);
    rect(ctx, new v2(maxScreenSpace.x, minScreenSpace.y), 1, ySize, colour);

    // top and bottom
    rect(ctx, minScreenSpace, xSize, 1, colour);
    rect(ctx, new v2(minScreenSpace.x, maxScreenSpace.y), xSize, 1, colour);
}

export function renderDebug (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: Sprite, sprites: Sprite[]) {
    renderGlobalGrid(ctx, canvas, camera,  `rgba(150, 150, 150, 0.3)`);
    renderGridDots(ctx, canvas, camera,  `rgba(150, 150, 150, 0.4)`, 1);
    renderCenterDot(ctx, canvas, camera,  `rgba(150, 150, 150, 0.6)`, 2);
    renderColliders(ctx, canvas, camera, `rgba(255, 230, 0, 0.6)`, sprites);
    drawCameras(ctx, canvas, camera, sprites);
}

export function renderSelectedOutline (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: Sprite, selected: Sprite) {
    if (!selected.hasComponent('Collider')) return;
    const collider = selected.getComponent<Collider>('Collider');
    renderCollider(ctx, canvas, camera, 'rgba(21,229,21,0.76)', collider, selected.transform);
}