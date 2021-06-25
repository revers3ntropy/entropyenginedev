import {rgb} from "../../util/colour.js";
import {Transform} from "../transform.js";
import {v2} from "../../util/maths/maths2D.js";
import {GUIElement} from "./gui.js";
import {text} from '../../render/renderer.js'


export class GUIText extends GUIElement {
    Start(transform: Transform): void {
    }
    // @ts-ignore
    text: string;
    // @ts-ignore
    fontSize: number;
    // @ts-ignore
    font: string;
    // @ts-ignore
    colour: colour;
    // @ts-ignore
    alignment: string;
    // @ts-ignore
    fill: boolean;

    constructor ({
         text = 'text',
         fontSize = 12,
         font = 'Arial',
         colour = rgb(0, 0, 0),
         alignment = 'center',
         fill = true,
         zLayer = 1,
     }) {
        super('GUIText', zLayer);

        this.addPublic({
            name: 'text',
            value: text,
            default: 'text'
        });
        this.addPublic({
            name: 'fontSize',
            value: fontSize,
            description: 'In px',
            default: 12
        });
        this.addPublic({
            name: 'font',
            value: font,
            default: 'Arial'
        });
        this.addPublic({
            name: 'colour',
            value: colour,
            type: 'rgb',
        });
        this.addPublic({
            name: 'alignment',
            value: alignment,
            description: 'Center, left or right. Default center',
            type: 'string',
            default: 'center'
        });
        this.addPublic({
            name: 'fill',
            value: fill,
            description: 'Should the text be filled or hollow',
            type: 'string',
            default: true
        });

    }

    draw (ctx: CanvasRenderingContext2D, transform: Transform) {
        text(ctx, this.text, this.fontSize * transform.scale.x, this.font, this.colour, transform.position.v2);
    }

    Update () {}

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform) {
        ctx.font = `${this.fontSize}px ${this.font}`;
        const textSize = ctx.measureText(this.text)
        return point.isInRect(transform.position.v2, new v2(
            textSize.width,
            this.fontSize * transform.scale.x
        ));
    }
}