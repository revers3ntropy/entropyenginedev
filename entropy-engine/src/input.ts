import {v2} from "./maths/maths.js";
import {Entity} from "./ECS/entity.js";
import {GUIElement, GUITextBox} from "./components/gui/gui.js";
import {Camera} from "./components/camera.js";

export function getMousePos(canvas: HTMLCanvasElement, event: MouseEvent) {
    let rect = canvas.getBoundingClientRect();

    const pos = new v2 (
        event.pageX - rect.left - scrollX,
        // invert
        rect.height - (
            event.pageY - rect.top - scrollY
        )
    );

    const scale = new v2(
        canvas.width / rect.width,
        canvas.height / rect.height
    );

    pos.mul(scale);

    return pos;
}

export function getMousePosWorldSpace (canvas: HTMLCanvasElement, event: MouseEvent) {
    const mousePos = getMousePos(canvas, event);
    return (<Entity>Camera.main)
        .getComponent<Camera>('Camera')
        .screenSpaceToWorldSpace(mousePos, canvas, Camera.main.transform.position);
}

export const input: any = {
    listen: (type: string, handler: (key: KeyboardEvent) => void) => {
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
    Entity.loop(sprite => {
        if (!sprite.hasComponent('GUIElement', 'GUITextBox')) return;

        const element = sprite.getComponent<GUITextBox>('GUIElement', 'GUITextBox');
        if (element.selected)
            element.keyPress(event);
    });
});

// for backspace and enter
// backspace: delete last character on selected text boxes
// enter:     unselect all text boxes
document.addEventListener('keydown', event => {
    if (event.keyCode !== 8) return;

    Entity.loop(sprite => {
        if (!sprite.hasComponent('GUIElement', 'GUITextBox')) return;

        const element = sprite.getComponent<GUITextBox>('GUIElement', 'GUITextBox');

        if (element.selected)
            element.backspace();
    });
});

export function setMousePos(event: any, canvas: HTMLCanvasElement) {
    input.cursorPosition = getMousePos(canvas, event);
    input.cursorPosWorldSpace = getMousePosWorldSpace(canvas, event);
}