import {rgb} from "../../util/colour.js";
import {Transform} from "../transform.js";
import {v2} from "../../util/maths/maths2D.js";
import {GUIElement} from "./gui.js";
import {GUIText} from "./text.js";

export class GUITextBox extends GUIElement {
    Start(transform: Transform): void {
    }
    text: GUIText;
    selected: boolean;
    limiter: (val: string) => string;
    // @ts-ignore
    maxLength: number;

    constructor ({
                     zLayer = 1,
                     initialText = 'text',
                     fontSize = 12,
                     font = 'Arial',
                     textColour = rgb(0, 0, 0),
                     textAlignment = 'center',
                     fillText = true,
                     limiter = (val: string) => val,
                     maxLength = 100
                 }) {
        super('GUITextBox', zLayer);

        this.text = new GUIText({
            text: initialText,
            fontSize,
            colour: textColour,
            font,
            alignment: textAlignment,
            fill: fillText,
        });
        this.selected = false;
        this.limiter = limiter;

        this.addPublic({
            name: 'maxLength',
            value: maxLength,
            default: 100
        });
    }

    draw (ctx: CanvasRenderingContext2D, transform: Transform): void {
        this.text.draw(ctx, transform);
    }

    Update (): void {
        this.text.Update();
    }

    touchingPoint(point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        return this.text.touchingPoint(point, ctx, transform);
    }

    limit () {
        this.text.text = this.limiter(this.text.text);
    }

    keyPress(event: KeyboardEvent) {
        const text = this.text.text;

        if (event.keyCode === 13){
            this.selected = false;
            return;
        }

        if (text.length >= this.maxLength) return;

        this.text.text = `${text}${String.fromCharCode(event.keyCode)}`;
        this.limit();
    }

    backspace () {
        this.text.text = this.text.text.slice(0, -1);
        this.limit();
    }

    get innerText () {
        return this.text.text;
    }

    set innerText (val: string) {
        this.text.text = val;
    }
}