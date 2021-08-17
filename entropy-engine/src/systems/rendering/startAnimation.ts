import {getCanvasSize, getCanvasStuff, sleep} from "../../util/general.js";
import {rect, text} from "./basicShapes.js";
import {v2} from "../../maths/maths.js";

export async function startAnimation(canvasID: string) {
    const {canvas, ctx} = getCanvasStuff(canvasID);

    const fontSize = canvas.width * 0.1;

    const canvasSize = getCanvasSize(canvas);

    rect(ctx, v2.zero, canvasSize.x, canvasSize.y, '#EEEEEE', 0);

    function draw() {
        // clear the screen
        rect(ctx, v2.zero, canvasSize.x, canvasSize.y, '#EEEEEE', 0);
        text(ctx, 'made with', fontSize / 2.5, `Nunito`, `rgb(60, 60, 60)`, new v2(canvas.width / 2 - fontSize / 1.6, canvas.height / 2 + fontSize / 1.5));
        text(ctx, 'Entropy Engine', fontSize, `Nunito`, `rgb(0, 0, 0)`, new v2(canvas.width / 2, canvas.height / 2 - fontSize / 2.5));
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