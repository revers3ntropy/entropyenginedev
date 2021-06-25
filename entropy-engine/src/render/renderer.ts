import {v2} from "../util/maths/maths.js"
import {sleep, getCanvasStuff, getCanvasSize} from "../util/general.js";
import {Sprite} from "../ECS/sprite.js";
import {GUIElement} from "../components/gui/gui.js";
import {Camera} from "../components/camera.js";
import { Renderer } from "../components/renderComponents.js";
import {parseColour} from "../util/colour.js";
import {background} from "../ECS/scene.js";

export function reset(ctx: CanvasRenderingContext2D) {
    ctx.transform(1, 0, 0, -1, 0, ctx.canvas.height);
}

function orderSpritesForRender (sprites: Sprite[]): Sprite[] {
    // sort the sprites by their z position
    const zOrderedSprites = sprites.sort((a: Sprite, b: Sprite) => {
        return a.transform.position.z - b.transform.position.z;
    })

    // GUI elements appear always above normal sprites,
    // so filter them out and put them last, still ordered by their z position
    let justSprites = [];
    let justGUI = [];
    for (let sprite of zOrderedSprites) {
        if (sprite.hasComponent('GUIElement'))
            justGUI.push(sprite);
        else
            justSprites.push(sprite);
    }

    return [...justSprites, ...justGUI];
}

export function renderBackground (ctx: CanvasRenderingContext2D, canvasSize: v2, background: background) {

    function fillBackground (alpha: number) {
        let bgColour = background?.tint || parseColour('white');
        bgColour = bgColour.clone;
        bgColour.alpha = alpha;

        ctx.beginPath();

        ctx.rect(0, 0, canvasSize.x, canvasSize.y);

        ctx.fillStyle = bgColour.rgba;

        ctx.fill();
        ctx.closePath();
    }

    if (!background || !background.image) {
        fillBackground(1);
        return;
    }
    // if it can't use the image as a background, then just use the colour
    try {
        image(ctx, v2.zero, canvasSize, background.image);
    } catch {
        fillBackground(0.1);
    }
}


export function renderAll (sprites: Sprite[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, background: background, cameraSprite: Sprite = Camera.main) {

    // background
    const canvasSize = getCanvasSize(canvas);
    const mid = canvasSize.clone.scale(0.5);


    renderBackground(ctx, canvasSize, background);

    if (!cameraSprite) {
        console.error('Camera was not passed to renderAll function! Main camera: ' + Camera.main.name);
        return;
    }

    // camera
    const camera = cameraSprite
        .getComponent<Camera>("Camera");

    if (!camera) return;

    const cameraPos = cameraSprite.transform.position.clone
        .sub(
            canvasSize
                .clone
                .scale(0.5).v3
        );
    // sub the screen size to put 0, 0 in the middle of the screen

    if (!cameraPos) return;

    // filter out sprites that don't have render components
    sprites = sprites.filter((sprite) => (
        sprite.hasComponent('Renderer') ||
        sprite.hasComponent('GUIElement')
    ));


    // call the draw function for each
    for (let sprite of orderSpritesForRender(sprites)) {
        // deal with GUI and normal render components separately
        if (sprite.hasComponent('GUIElement')) {
            sprite.getComponent<GUIElement>('GUIElement').draw(ctx, sprite.transform);
            continue;
        }

        const renderPos = sprite.transform.position.clone.sub(cameraPos);

        sprite.getComponent<Renderer>('Renderer').draw({
            position: renderPos,
            transform: sprite.transform,
            ctx,
            zoom: camera.zoom,
            center: mid,
            camera,
            cameraSprite
        });
    }
}


// canvas util

export function setCanvasSize (canvas: HTMLCanvasElement) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}


export async function startAnimation (canvasID: string) {
    const { canvas, ctx } = getCanvasStuff(canvasID);

    const fontSize = canvas.width*0.1;

    const canvasSize = getCanvasSize(canvas);

    rect(ctx, v2.zero, canvasSize.x, canvasSize.y, '#EEEEEE');

    function draw() {
        // clear the screen
        rect(ctx, v2.zero, canvasSize.x, canvasSize.y, '#EEEEEE');
        text(ctx, 'made with', fontSize / 2.5, `Nunito`, `rgb(60, 60, 60)`, new v2(canvas.width/2 - fontSize/1.6, canvas.height/2 + fontSize/1.5));
        text(ctx, 'Entropy Engine', fontSize, `Nunito`, `rgb(0, 0, 0)`, new v2(canvas.width/2, canvas.height / 2 - fontSize/2.5));
    }

    // animation
    draw();

    await sleep(500);

    const startTime = performance.now();

    while (performance.now() - startTime < 1000 && ctx.globalAlpha > 0) {
        ctx.globalAlpha -= 0.005;
        draw();
        await sleep(1);
    }

    // reset
    ctx.globalAlpha = 1;
}

// draw functions
export function roundedRect (ctx: CanvasRenderingContext2D, width: number, height: number, pos: v2, colour: string, radius: number) {
    // src: https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
    ctx.beginPath();

    ctx.moveTo(pos.x + radius, pos.y);
    ctx.lineTo(pos.x + width - radius, pos.y);
    ctx.quadraticCurveTo(pos.x + width, pos.y, pos.x + width, pos.y + radius);
    ctx.lineTo(pos.x + width, pos.y + height - radius);
    ctx.quadraticCurveTo(pos.x + width, pos.y + height, pos.x + width - radius, pos.y + height);
    ctx.lineTo(pos.x + radius, pos.y + height);
    ctx.quadraticCurveTo(pos.x, pos.y + height, pos.x, pos.y + height - radius);
    ctx.lineTo(pos.x, pos.y + radius);
    ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
    ctx.closePath();

    ctx.fillStyle = colour;

    ctx.fill();
    ctx.closePath();
}

export function circle (ctx: CanvasRenderingContext2D, position: v2, radius: number, colour: string) {
    ctx.beginPath();

    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);

    ctx.fillStyle = colour;

    ctx.fill();
    ctx.closePath();
}

export function rect (ctx: CanvasRenderingContext2D, position: v2, width: number, height: number, colour: string) {
    ctx.beginPath();

    ctx.rect(position.x, position.y, width, height);

    ctx.fillStyle = colour;

    ctx.fill();
    ctx.closePath();
}

export function polygon (ctx: CanvasRenderingContext2D, points: v2[], fillColour: string, fill = true) {
    ctx.beginPath();

    ctx.moveTo(points[0].x, points[0].y);
    ctx.strokeStyle = fillColour;

    for (let point of points.slice(1, points.length))
        ctx.lineTo(point.x, point.y);

    if (fill) {
        ctx.fillStyle = fillColour;
        ctx.fill();

        ctx.closePath();
    } else {
        ctx.stroke();
    }

}

export function text (ctx: CanvasRenderingContext2D, text: string, fontSize: number, font: string, colour: string, position: v2, alignment='center') {
    ctx.beginPath();

    ctx.font = `${fontSize}px ${font}`;
    ctx.fillStyle = colour;
    ctx.textBaseline = "middle";
    ctx.textAlign = alignment as CanvasTextAlign;
    // flip text as the whole canvas is actually flipped

    const size = new v2( ctx.measureText(text).width, fontSize);
    const center = position.clone.add(size.clone.scale(0.5));

    ctx.translate(center.x, center.y);
    ctx.rotate(Math.PI);
    ctx.scale(-1, 1);
    ctx.translate(-center.x, -center.y);

    ctx.fillText(text, position.x, position.y);

    ctx.translate( center.x, center.y );
    ctx.rotate( -Math.PI );
    ctx.scale(-1, 1);
    ctx.translate( -center.x, -center.y );

    ctx.closePath();
}

export function image (ctx: CanvasRenderingContext2D, position: v2, size: v2, src: string) {
    position = position.clone;
    ctx.beginPath();
    let img = new Image;
    img.src = src;
    const center = position.clone.add(size.clone.scale(0.5));
    // center rotation on image
    ctx.translate(center.x, center.y);
    ctx.rotate(Math.PI);
    ctx.scale(-1, 1);
    ctx.translate(-center.x, -center.y);

    ctx.drawImage(img, position.x, position.y, size.x, size.y); // draw the image

    // undo 180 transform
    ctx.translate(center.x, center.y);
    ctx.rotate(-Math.PI);
    ctx.scale(-1, 1);
    ctx.translate(-center.x, -center.y);
    ctx.closePath();
}

