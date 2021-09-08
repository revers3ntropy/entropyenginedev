import {Camera} from '../../components/camera.js';
import {Entity} from '../../ECS/entity.js';
import {getCanvasSize} from '../../util/general.js';
import {circle, rect, image, rotateAroundPointWrapper} from './basicShapes.js';
import {v2} from '../../maths/maths.js';
import {CircleCollider, RectCollider, Collider } from '../../components/colliders.js';

import { Transform } from '../../components/transform.js';

function getGlobalGrid (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Entity) {
    const cameraC = camera.getComponent<Camera>('Camera');
    const zoom = cameraC.zoom;
    const canvasSize = getCanvasSize(canvas);

    // find nearest order of magnitude
    var order = Math.floor(Math.log(zoom) / Math.LN10
        + 0.000000001); // because float math sucks like that
    const zoomToNearestPow = Math.pow(10,order);
    let step = (1/zoomToNearestPow) * 50;

    const min = cameraC.screenSpaceToWorldSpace(new v2(0, 0), canvas, camera.transform.position);
    const max = cameraC.screenSpaceToWorldSpace(canvasSize, canvas, camera.transform.position);

    if ((max.x - min.x) / step < 5)
        step /= 2;

    const roundTo = (x: number) => Math.ceil(x / step) * step;

    min.apply(roundTo);
    max.apply(roundTo);
    
    return {
        step, min, max, zoom
    }
}

function renderGlobalGrid (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Entity, colour: string) {
    const {step, min, max} = getGlobalGrid(ctx, canvas, camera);
    const canvasSize = getCanvasSize(canvas);
    const cameraC = camera.getComponent<Camera>('Camera');
    
    // horizontal
    for (let y = min.y; y < max.y; y += step) {
        const pos = cameraC.worldSpaceToScreenSpace(new v2(0, y), canvas, camera.transform.position);
        pos.x = -1;
        rect(ctx, pos, canvasSize.x+2, 1, colour, 0);
    }

    // vertical
    for (let x = min.x; x < max.x; x += step) {
        const pos = cameraC.worldSpaceToScreenSpace(new v2(x, 0), canvas, camera.transform.position);
        pos.y = -1;
        rect(ctx, pos, 1, canvasSize.y+2, colour, 0);
    }
}

function renderGridDots (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Entity, colour: string, r: number) {
    const {step, min, max} = getGlobalGrid(ctx, canvas, camera);
    const cameraC = camera.getComponent<Camera>('Camera');
    
    for (let x = min.x; x < max.x; x += step) {
        for (let y = min.y; y < max.y; y += step) {
            const pos = cameraC.worldSpaceToScreenSpace(new v2(x, y), canvas, camera.transform.position);
            circle(ctx, pos, r, colour);
        }
    }
}

function renderCenterDot (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Entity, colour: string, r: number) {
    const cameraC = camera.getComponent<Camera>('Camera');
    const pos = cameraC.worldSpaceToScreenSpace(v2.zero, canvas, camera.transform.position);
    circle(ctx, pos, r, colour);
}

function renderCollider (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Entity, colour: string, collider: Collider, transform: Transform) {
    const cameraC = camera.getComponent<Camera>('Camera');
    const zoom = camera.getComponent<Camera>('Camera').zoom;

    ctx.beginPath();
    ctx.strokeStyle = colour;
    
    let pos = cameraC.worldSpaceToScreenSpace(
        transform.position.clone.v2
            .add(collider.offset),
        canvas, camera.transform.position
    );

    if (collider instanceof RectCollider) {

        const size = new v2(collider.width, collider.height);
        const dimensions = transform.scale.v2.mul(size);
        dimensions.scale(zoom);
        const center = pos.clone;
        pos = pos.clone.sub(dimensions.clone.scale(1/2));

        rotateAroundPointWrapper(ctx,
            center,
            transform.rotation.z, () => {
            ctx.rect(pos.x, pos.y, dimensions.x, dimensions.y);
            ctx.stroke();
        });

    } else if (collider instanceof CircleCollider) {
        ctx.arc(pos.x, pos.y, collider.radius * transform.scale.x * zoom, 0,2 * Math.PI);
        ctx.stroke();
    }
}

function renderColliders (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Entity, colour: string, sprites: Entity[]) {
    for (const sprite of sprites) {
        if (!sprite.hasComponent('Collider')) continue;
        const collider = sprite.getComponent<Collider>('Collider');
        renderCollider(ctx, canvas, camera, colour, collider, sprite.transform);
    }
}

export function drawCameras (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Entity, sprites: Entity[]) {
    const cameraC = camera.getComponent<Camera>('Camera');
    for (const sprite of sprites) {
        if (!sprite.hasComponent('Camera')) continue;
        let pos = cameraC.worldSpaceToScreenSpace(sprite.transform.position.v2, canvas, camera.transform.position);
        pos.sub(new v2(2));
        image(ctx, pos, new v2(80, 40), 'https://entropyengine.dev/svg/camera.png', 0);
    }
}

export function drawCameraViewArea (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, camera: Entity, cameraToDraw: Entity, colour: string) {
    const canvasSize = getCanvasSize(canvas);
    const cameraC = camera.getComponent<Camera>('Camera');
    const cameraToDrawC = cameraToDraw.getComponent<Camera>('Camera');

    const min = cameraToDrawC.screenSpaceToWorldSpace(new v2(0, 0), canvas, cameraToDraw.transform.position);
    const max = cameraToDrawC.screenSpaceToWorldSpace(canvasSize, canvas, cameraToDraw.transform.position);
    
    const minScreenSpace = cameraC.worldSpaceToScreenSpace(min, canvas, camera.transform.position);
    const maxScreenSpace = cameraC.worldSpaceToScreenSpace(max, canvas, camera.transform.position);

    const ySize = Math.abs(minScreenSpace.y - maxScreenSpace.y);
    const xSize = Math.abs(minScreenSpace.x - maxScreenSpace.x);

    // left and right
    rect(ctx, minScreenSpace, 1, ySize, colour, 0);
    rect(ctx, new v2(maxScreenSpace.x, minScreenSpace.y), 1, ySize, colour, 0);

    // top and bottom
    rect(ctx, minScreenSpace, xSize, 1, colour, 0);
    rect(ctx, new v2(minScreenSpace.x, maxScreenSpace.y), xSize, 1, colour, 0);
}

export function renderDebug (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: Entity, entities: Entity[]) {
    renderGlobalGrid(ctx, canvas, camera,  `rgba(150, 150, 150, 0.3)`);
    //renderGridDots(ctx, canvas, camera,  `rgba(150, 150, 150, 0.4)`, 1);
    renderCenterDot(ctx, canvas, camera,  `rgba(150, 150, 150, 0.6)`, 2);
    renderColliders(ctx, canvas, camera, `rgba(255, 230, 0, 0.6)`, entities);
    drawCameras(ctx, canvas, camera, entities);
}

export function renderSelectedOutline (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: Entity, selected: Entity) {
    if (!selected.hasComponent('Collider')) return;
    const collider = selected.getComponent<Collider>('Collider');
    renderCollider(ctx, canvas, camera, 'rgba(21,229,21,0.76)', collider, selected.transform);
}