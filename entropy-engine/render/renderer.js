var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v2 } from "../util/maths/maths.js";
import { sleep, getCanvasStuff, getCanvasSize } from "../util/util.js";
import { Camera } from "../ECS/components/camera.js";
import { parseColour } from "../util/colour.js";
export function reset(ctx) {
    ctx.transform(1, 0, 0, -1, 0, ctx.canvas.height);
}
function orderSpritesForRender(sprites) {
    // sort the sprites by their z position
    const zOrderedSprites = sprites.sort((a, b) => {
        return a.transform.position.z - b.transform.position.z;
    });
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
export function renderBackground(ctx, canvasSize, background) {
    function fillBackground(alpha) {
        let bgColour = (background === null || background === void 0 ? void 0 : background.tint) || parseColour('white');
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
    }
    catch (_a) {
        fillBackground(0.1);
    }
}
export function renderAll(sprites, canvas, ctx, background, cameraSprite) {
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
        .getComponent("Camera");
    if (!camera)
        return;
    const cameraPos = Camera.main.transform.position.clone
        .sub(canvasSize
        .clone
        .scale(0.5).v3);
    // sub the screen size to put 0, 0 in the middle of the screen
    if (!cameraPos)
        return;
    // filter out sprites that don't have render components
    sprites = sprites.filter((sprite) => (sprite.hasComponent('Renderer') ||
        sprite.hasComponent('GUIElement')));
    // call the draw function for each
    for (let sprite of orderSpritesForRender(sprites)) {
        // deal with GUI and normal render components separately
        if (sprite.hasComponent('GUIElement')) {
            sprite.getComponent('GUIElement').draw(ctx, sprite.transform);
            continue;
        }
        const renderPos = sprite.transform.position.clone.sub(cameraPos);
        sprite.getComponent('Renderer').draw({
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
export function setCanvasSize(canvas) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
export function startAnimation(canvasID) {
    return __awaiter(this, void 0, void 0, function* () {
        const { canvas, ctx } = getCanvasStuff(canvasID);
        const fontSize = canvas.width * 0.1;
        const canvasSize = getCanvasSize(canvas);
        rect(ctx, v2.zero, canvasSize.x, canvasSize.y, '#EEEEEE');
        function draw() {
            // clear the screen
            rect(ctx, v2.zero, canvasSize.x, canvasSize.y, '#EEEEEE');
            text(ctx, 'made with', fontSize / 2.5, `Nunito`, `rgb(60, 60, 60)`, new v2(canvas.width / 2 - fontSize / 1.6, canvas.height / 2 + fontSize / 1.5));
            text(ctx, 'Entropy Engine', fontSize, `Nunito`, `rgb(0, 0, 0)`, new v2(canvas.width / 2, canvas.height / 2 - fontSize / 2.5));
        }
        // animation
        draw();
        yield sleep(500);
        const startTime = performance.now();
        while (performance.now() - startTime < 1000 && ctx.globalAlpha > 0) {
            ctx.globalAlpha -= 0.005;
            draw();
            yield sleep(1);
        }
        // reset
        ctx.globalAlpha = 1;
    });
}
// draw functions
export function roundedRect(ctx, width, height, pos, colour, radius) {
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
export function circle(ctx, position, radius, colour) {
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.closePath();
}
export function rect(ctx, position, width, height, colour) {
    ctx.beginPath();
    ctx.rect(position.x, position.y, width, height);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.closePath();
}
export function polygon(ctx, points, fillColour, fill = true) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.strokeStyle = fillColour;
    for (let point of points.slice(1, points.length))
        ctx.lineTo(point.x, point.y);
    if (fill) {
        ctx.fillStyle = fillColour;
        ctx.fill();
        ctx.closePath();
    }
    else {
        ctx.stroke();
    }
}
export function text(ctx, text, fontSize, font, colour, position, alignment = 'center') {
    ctx.beginPath();
    ctx.font = `${fontSize}px ${font}`;
    ctx.fillStyle = colour;
    ctx.textBaseline = "middle";
    ctx.textAlign = alignment;
    // flip text as the whole canvas is actually flipped
    const size = new v2(ctx.measureText(text).width, fontSize);
    const center = position.clone.add(size.clone.scale(0.5));
    ctx.translate(center.x, center.y);
    ctx.rotate(Math.PI);
    ctx.scale(-1, 1);
    ctx.translate(-center.x, -center.y);
    ctx.fillText(text, position.x, position.y);
    ctx.translate(center.x, center.y);
    ctx.rotate(-Math.PI);
    ctx.scale(-1, 1);
    ctx.translate(-center.x, -center.y);
    ctx.closePath();
}
export function image(ctx, position, size, src) {
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
