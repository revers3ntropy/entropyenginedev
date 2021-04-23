var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v2 } from "./maths.js";
import { sleep, getCanvasStuff } from "./util.js";
// canvas util
export function setCanvasSize(canvasID, width, height) {
    var _a, _b, _c, _d;
    // get the canvas and context
    const { ctx } = getCanvasStuff(canvasID);
    // set both the width and the height based off whether or not once has been specified - if it hasn't keep it the same
    // the '?? number' is a backup if the boundingClientRect cannot be found on the canvas element - so default value if everything goes wrong
    let actualWidth = width || ((_b = (_a = document.getElementById(canvasID)) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect().width) !== null && _b !== void 0 ? _b : 10);
    let actualHeight = height || ((_d = (_c = document.getElementById(canvasID)) === null || _c === void 0 ? void 0 : _c.getBoundingClientRect().height) !== null && _d !== void 0 ? _d : 10);
    ctx.canvas.width = actualWidth;
    ctx.canvas.height = actualHeight;
    // return what the actual size of the canvas is for use later on
    return [actualWidth, actualHeight];
}
export function startAnimation(canvasID) {
    return __awaiter(this, void 0, void 0, function* () {
        const { canvas, ctx } = getCanvasStuff(canvasID);
        const fontSize = canvas.width * 0.1;
        function draw() {
            text(ctx, 'made with', fontSize / 2.5, `Nunito`, `rgb(60, 60, 60)`, new v2(canvas.width / 2 - fontSize / 1.6, canvas.height / 2 + fontSize / 1.5));
            text(ctx, 'Entropy Engine', fontSize, `Nunito`, `rgb(0, 0, 0)`, new v2(canvas.width / 2, canvas.height / 2 - fontSize / 2.5));
        }
        // animation
        draw();
        yield sleep(500);
        const startTime = performance.now();
        while (performance.now() - startTime < 1000 && ctx.globalAlpha > 0) {
            ctx.globalAlpha -= 0.005;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
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
export function polygon(ctx, points, fillColour) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let point of points.slice(1, points.length))
        ctx.lineTo(point.x, point.y);
    ctx.fillStyle = fillColour;
    ctx.fill();
    ctx.closePath();
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
    ctx.translate(center.x, center.y);
    ctx.rotate(-Math.PI);
    ctx.translate(-center.x, -center.y);
    ctx.closePath();
}
