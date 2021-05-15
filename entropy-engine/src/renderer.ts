import {v2} from "./maths.js"
import {sleep, getCanvasStuff} from "./util.js";

// canvas util

export function setCanvasSize (canvas: HTMLCanvasElement) {
    /* depricated
    // get the canvas and context from two numbers
    const { ctx, canvas } = getCanvasStuff(canvasID);
    // set both the width and the height based off whether or not once has been specified - if it hasn't keep it the same
    // the '?? number' is a backup if the boundingClientRect cannot be found on the canvas element - so default value if everything goes wrong
    let actualWidth = width || (document.getElementById(canvasID)?.getBoundingClientRect().width ?? 10);
    let actualHeight = height || (document.getElementById(canvasID)?.getBoundingClientRect().height ?? 10);
    canvas.style.width = `${actualWidth}px`;
    canvas.style.height = `${actualHeight}px`;
    // return what the actual size of the canvas is for use later on
    return [actualWidth, actualHeight]
     */
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}


export async function startAnimation (canvasID: string) {
    const { canvas, ctx } = getCanvasStuff(canvasID);

    const fontSize = canvas.width*0.1;

    function draw() {
        text(ctx, 'made with', fontSize / 2.5, `Nunito`, `rgb(60, 60, 60)`, new v2(canvas.width/2 - fontSize/1.6, canvas.height/2 + fontSize/1.5));
        text(ctx, 'Entropy Engine', fontSize, `Nunito`, `rgb(0, 0, 0)`, new v2(canvas.width/2, canvas.height / 2 - fontSize/2.5));
    }

    // animation
    draw();
    await sleep(500);

    const startTime = performance.now();

    while (performance.now() - startTime < 1000 && ctx.globalAlpha > 0) {
        ctx.globalAlpha -= 0.005;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

export function polygon (ctx: CanvasRenderingContext2D, points: v2[], fillColour: string) {
    ctx.beginPath();

    ctx.moveTo(points[0].x, points[0].y);

    for (let point of points.slice(1, points.length))
        ctx.lineTo(point.x, point.y);

    ctx.fillStyle = fillColour;
    ctx.fill();

    ctx.closePath();
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
    ctx.beginPath();

    let img = new Image;
    img.src = src;

    const center = position.clone.add(size.clone.scale(0.5));
    // center rotation on image
    ctx.translate(center.x, center.y);
    ctx.rotate(Math.PI);
    ctx.translate(-center.x, -center.y);
    ctx.drawImage(img, position.x, position.y, size.x, size.y);

    // undo 180 transform
    ctx.translate( center.x, center.y );
    ctx.rotate( -Math.PI );
    ctx.translate( -center.x, -center.y );
    ctx.closePath();
}

