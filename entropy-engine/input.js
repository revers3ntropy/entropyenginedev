import { v2 } from "./maths.js";
import { Sprite } from "./sprite.js";
import { Camera } from "./camera.js";
import { getZoomScaledPosition } from "./util.js";
export function getMousePos(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    return new v2(event.clientX - rect.left, canvas.height - (event.clientY - rect.top));
}
export function getMousePosWorldSpace(canvas, event) {
    const mousePos = getMousePos(canvas, event), center = new v2(canvas.width, canvas.height).scale(0.5), camera = Camera.main;
    mousePos.set(getZoomScaledPosition(mousePos, 1 / camera.getComponent('Camera').zoom, center));
    mousePos.add(camera.transform.position);
    mousePos.sub(center);
    return mousePos;
}
export const input = {
    listen: (type, handler) => {
        // @ts-ignore
        document.addEventListener(type, handler);
    },
    'mouseDown': false,
    'cursorPosition': v2.zero,
    'cursorPosWorldSpace': v2.zero
};
// init input for keycodes
for (let i = 8; i < 123; i++) {
    input[i] = false;
    input[String.fromCharCode(i)] = i;
}
input.Space = 32;
input.Enter = 13;
input.Shift = 16;
input.Backspace = 8;
input.Ctrl = 17;
input.Alt = 18;
input.CmdR = 93;
input.CmdL = 91;
input.WindowsKey = 91;
input.Left = 37;
input.Right = 39;
input.Up = 38;
input.Down = 40;
document.addEventListener('keydown', event => {
    input[event.keyCode] = true;
});
document.addEventListener('keyup', event => {
    input[event.keyCode] = false;
});
document.addEventListener('keypress', event => {
    Sprite.loopThroughSprites(sprite => {
        if (!sprite.hasComponent('GUIElement', 'GUITextBox'))
            return;
        const element = sprite.getComponent('GUIElement', 'GUITextBox');
        if (element.selected)
            element.keyPress(event);
    });
});
// for backspace and enter
// backspace: delete last character on selected text boxes
// enter:     unselect all text boxes
document.addEventListener('keydown', event => {
    if (event.keyCode !== 8)
        return;
    Sprite.loopThroughSprites(sprite => {
        if (!sprite.hasComponent('GUIElement', 'GUITextBox'))
            return;
        const element = sprite.getComponent('GUIElement', 'GUITextBox');
        if (element.selected)
            element.backspace();
    });
});
export function setMousePos(event, canvas) {
    input.cursorPosition = getMousePos(canvas, event);
    input.cursorPosWorldSpace = getMousePosWorldSpace(canvas, event);
}
