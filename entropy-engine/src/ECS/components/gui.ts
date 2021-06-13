import {circle, image, polygon, roundedRect, text} from '../../render/renderer.js'
import {polygonCollidingWithPoint, v2} from "../../util/maths/maths.js"
import {Component} from "../component.js"
import {JSONifyComponent, scaleMesh} from "../../util/util.js";
import { Transform } from '../transform.js';
import { rgb } from '../../index.js';

export abstract class GUIElement extends Component {

    abstract draw (ctx: CanvasRenderingContext2D, transform: Transform): void;
    abstract touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean;

    hovered: boolean;
    // @ts-ignore
    zLayer: number;

    protected constructor (subtype: string, zLayer: number) {
        super('GUIElement', subtype);

        this.hovered = false;

        this.addPublic({
            name: 'zLayer',
            value: zLayer,
            description: 'Determines what appears on top of what in the GUI',
            type: 'number'
        });

    }

    json () {
        return JSONifyComponent(this);
    }
}

export class GUIText extends GUIElement {
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

    tick () {}

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform) {
        ctx.font = `${this.fontSize}px ${this.font}`;
        const textSize = ctx.measureText(this.text)
        return point.isInRect(transform.position.v2, new v2(
            textSize.width,
            this.fontSize * transform.scale.x
        ));
    }
}

export class GUIBox extends GUIElement {
    // @ts-ignore
    height: number;
    // @ts-ignore
    width: number;
    // @ts-ignore
    radius: number;
    // @ts-ignore
    innerColour: colour;
    // @ts-ignore
    outerColour: colour;
    // @ts-ignore
    borderThickness: number;

    constructor ({
        height = 30,
        width = 60,
        radius = 0,
        innerColour = rgb(230, 230, 230),
        outerColour = rgb(90,90,90),
        borderThickness = 1,
        zLayer = 1,
    }) {
        super('GUIBox', zLayer);

        this.addPublic({
            name: 'height',
            value: height,
            default: 30
        });
        this.addPublic({
            name: 'width',
            value: width,
            default: 60
        });
        this.addPublic({
            name: 'radius',
            value: Math.min(radius, width/2, height/2),
            description: 'Radius of the bod - maxed at (size of smaller dimension)/2',
            default: 0,
            overrideSet: (value) => {
                // limit value
                const r = Math.min(value, this.width/2, this.height/2);
                this.setPublic('radius', r);
            }
        });
        this.addPublic({
            name: 'innerColour',
            value: innerColour,
            description: 'Colour of background of box',
            type: 'rgb'
        });
        this.addPublic({
            name: 'outerColour',
            value: outerColour,
            description: 'Colour of border of box',
            type: 'rgb'
        });
        this.addPublic({
            name: 'borderThickness',
            value: borderThickness,
            default: 1
        });
    }

    tick () {}

    draw (ctx: CanvasRenderingContext2D, transform: Transform) {
        if (this.width === 0 || this.height === 0) return;

        if (this.borderThickness > 0)
            roundedRect (
                ctx,
                this.width * transform.scale.x,
                this.height * transform.scale.y,
                transform.position.v2,
                this.outerColour,
                this.radius
            );

        const s = this.borderThickness;
        roundedRect (
            ctx,
            (this.width * transform.scale.x) - s*2,
            (this.height * transform.scale.y) - s*2,
            transform.position.v2.add(new v2(s, s)),
            this.innerColour,
            this.radius - s
        );
    }

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform) {
        return point.isInRect(transform.position.v2, new v2(this.width * transform.scale.x, this.height * transform.scale.y));
    }
}

export class GUITextBox extends GUIElement {
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

    tick (): void {
        this.text.tick();
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

export class GUIRect extends GUIElement {
    // @ts-ignore
    width: number;
    // @ts-ignore
    height: number;
    // @ts-ignore
    colour: string;
    // @ts-ignore
    radius: number

    constructor ({
        zLayer = 1,
        width = 10,
        height = 10,
        colour = rgb(150, 150, 150),
        radius = 1
    }) {
        super('GUIRect', zLayer);

        this.addPublic({
            name: 'height',
            value: height,
        });

        this.addPublic({
            name: 'width',
            value: width,
        });

        this.addPublic({
            name: 'radius',
            value: Math.min(radius, width / 2, height / 2),
            description: 'Radius of the bod - maxed at (size of smaller dimension)/2',
            default: 0,
            overrideSet: (value) => {
                // limit value
                const r = Math.min(value, this.width / 2, this.height / 2);
                this.setPublic('radius', r);
            }
        });
        this.addPublic({
            name: 'colour',
            value: colour,
            type: 'rgb'
        });
    }


    draw(ctx: CanvasRenderingContext2D, transform: Transform): void {
        const width = this.width * transform.scale.x;
        const height = this.height * transform.scale.y;

        if (height <= 0 || width <= 0) return;

        roundedRect (
            ctx,
            width,
            height,
            transform.position.v2,
            this.colour,
            this.radius
        );
    }

    tick(): void {}

    touchingPoint(point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        const width = this.width * transform.scale.x;
        const height = this.height * transform.scale.y;

        return point.isInRect(transform.position.v2, new v2(width, height));
    }
}

export class GUICircle extends GUIElement {
    // @ts-ignore
    colour: string;
    // @ts-ignore
    radius: number

    constructor ({
        zLayer = 1,
        colour = rgb(150, 150, 150),
        radius = 1
    }) {
        super('GUIRect', zLayer);

        this.addPublic({
            name: 'colour',
            value: colour,
            type: 'rgb'
        });
        this.addPublic({
            name: 'radius',
            value: radius,
        });
    }

    draw(ctx: CanvasRenderingContext2D, transform: Transform): void {
        const radius = this.radius * transform.scale.x;

        if (radius <= 0) return;
        circle(ctx, transform.position.v2, radius, this.colour);
    }

    tick(): void {}

    touchingPoint(point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        return point.clone.distTo(transform.position.v2) <= this.radius * transform.scale.x;
    }
}

export class GUIPolygon extends GUIElement {
    // @ts-ignore
    colour: string;
    // @ts-ignore
    points: v2[];

    constructor ({
        zLayer = 1,
        colour = rgb(150, 150, 150),
        points = [v2.zero]
    }) {
        super('GUIPolygon', zLayer);

        this.addPublic({
            name: 'colour',
            value: colour,
            type: 'rgb'
        });
        this.addPublic({
            name: 'points',
            value: points,
            type: 'v2',
            array: true
        });
    }

    draw(ctx: CanvasRenderingContext2D, transform: Transform): void {
        if (this.points.length <= 1) return;

        polygon(ctx, scaleMesh(this.points, transform.scale.v2), this.colour);
    }

    tick(): void {}

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        // quite hard to implement as a polygon is a very complex shape
        // very expensive calculation
        return polygonCollidingWithPoint(this.points, point);
    }
}

export class GUIImage extends GUIElement {
    // @ts-ignore
    width: number;
    // @ts-ignore
    height: number;
    // @ts-ignore
    url: string;

    constructor ({
        zLayer = 1,
        width = 100,
        height = 100,
        url = '',
    }) {
        super('GUIImage', zLayer);

        this.addPublic({
            name: 'height',
            value: height,
        });

        this.addPublic({
            name: 'width',
            value: width,
        });

        this.addPublic({
            name: 'url',
            value: url,
        });
    }

    draw(ctx: CanvasRenderingContext2D, transform: Transform): void {
        const width = this.width * transform.scale.x;
        const height = this.height * transform.scale.y;

        if (height <= 0 || width <= 0) return;

        image(ctx, transform.position.v2, new v2(width, height), this.url);
    }

    tick(): void {}

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        // quite hard to implement as a polygon is a very complex shape
        // very expensive calculation
        const width = this.width * transform.scale.x;
        const height = this.height * transform.scale.y;

        return point.isInRect(transform.position.v2, new v2(width, height));
    }
}