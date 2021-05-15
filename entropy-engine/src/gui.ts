import {circle, image, polygon, roundedRect, text} from './renderer.js'
import {polygonCollidingWithPoint, v2} from "./maths.js"
import {Component, Transform} from "./component.js"
import {JSONifyComponent, scaleMesh} from "./util.js";

export abstract class GUIElement extends Component {
    abstract draw (ctx: CanvasRenderingContext2D, transform: Transform): void;
    abstract touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean;

    hovered: boolean;
    zLayer: number;

    protected constructor (subtype: string, zLayer: number) {
        super('GUIElement', subtype);
        this.zLayer = zLayer;
        this.hovered = false;
    }

    json () {
        return JSONifyComponent(this);
    }
}

export class GUIText extends GUIElement {
    text: string;
    fontSize: number;
    font: string;
    colour: string;
    alignment: string;
    fill: boolean;

    constructor ({
        text = 'text',
        fontSize = 12,
        font = 'Arial',
        colour = 'rgb(0, 0, 0)',
        alignment = 'center',
        fill = true,
        zLayer = 1,
    }) {
        super(
            'GUIText',
            zLayer
        );

        this.text = text;
        this.fontSize = fontSize;
        this.font = font;
        this.colour = colour;
        this.alignment = alignment;
        this.fill = fill;
    }

    draw (ctx: CanvasRenderingContext2D, transform: Transform) {
        text(ctx, this.text,this.fontSize * transform.scale.x, this.font, this.colour, transform.position);
    }

    tick () {}

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform) {
        ctx.font = `${this.fontSize}px ${this.font}`;
        const textSize = ctx.measureText(this.text)
        return point.isInRect(transform.position, new v2(
            textSize.width,
            this.fontSize * transform.scale.x
        ));
    }
}

export class GUIBox extends GUIElement {
    height: number;
    width: number;
    radius: number;
    innerColour: string;
    outerColour: string;
    borderThickness: number;

    constructor ({
        height = 30,
        width = 60,
        radius = 1,
        innerColour = 'rgb(230, 230, 230)',
        outerColour = 'rgb(90,90,90)',
        borderThickness = 1,
        zLayer = 1,
    }) {
        super('GUIBox', zLayer);

        this.height = height;
        this.width = width;
        this.radius = Math.min(radius, width/2, height/2);
        this.innerColour = innerColour;
        this.outerColour = outerColour;
        this.borderThickness = borderThickness;
    }

    tick () {}

    draw (ctx: CanvasRenderingContext2D, transform: Transform) {
        if (this.width === 0 || this.height === 0) return;

        if (this.borderThickness > 0)
            roundedRect (
                ctx,
                this.width * transform.scale.x,
                this.height * transform.scale.y,
                transform.position,
                this.outerColour,
                this.radius
            );

        const s = this.borderThickness;
        roundedRect (
            ctx,
            (this.width * transform.scale.x) - s*2,
            (this.height * transform.scale.y) - s*2,
            transform.position.clone.add(new v2(s, s)),
            this.innerColour,
            this.radius - s
        );
    }

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform) {
        return point.isInRect(transform.position, new v2(this.width * transform.scale.x, this.height * transform.scale.y));
    }
}

export class GUITextBox extends GUIElement {
    text: GUIText;
    selected: boolean;
    limiter: (val: string) => string;
    maxLength: number;

    constructor ({
         zLayer = 1,
         initialText = 'text',
         fontSize = 12,
         font = 'Arial',
         textColour = 'rgb(0, 0, 0)',
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
        })

        this.selected = false;
        this.limiter = limiter;
        this.maxLength = maxLength;
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
    width: number;
    height: number;
    colour: string;
    radius: number

    constructor ({
        zLayer = 1,
        width = 10,
        height = 10,
        colour = 'rgb(150, 150, 150)',
        radius = 1
    }) {
        super('GUIRect', zLayer);

        this.width = width;
        this.height = height;
        this.colour = colour;
        this.radius = Math.min(radius, height/2, width/2);
    }


    draw(ctx: CanvasRenderingContext2D, transform: Transform): void {
        const width = this.width * transform.scale.x;
        const height = this.height * transform.scale.y;

        if (height <= 0 || width <= 0) return;

        roundedRect (
            ctx,
            width,
            height,
            transform.position,
            this.colour,
            this.radius
        );
    }

    tick(): void {}

    touchingPoint(point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        const width = this.width * transform.scale.x;
        const height = this.height * transform.scale.y;

        return point.isInRect(transform.position, new v2(width, height));
    }
}

export class GUICircle extends GUIElement {
    colour: string;
    radius: number

    constructor ({
                     zLayer = 1,
                     colour = 'rgb(150, 150, 150)',
                     radius = 1
                 }) {
        super('GUIRect', zLayer);

        this.colour = colour;
        this.radius = radius;
    }

    draw(ctx: CanvasRenderingContext2D, transform: Transform): void {
        const radius = this.radius * transform.scale.x;

        if (radius <= 0) return;
        circle(ctx, transform.position, radius, this.colour);
    }

    tick(): void {}

    touchingPoint(point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        return point.clone.distTo(transform.position) <= this.radius * transform.scale.x;
    }
}

export class GUIPolygon extends GUIElement {
    colour: string;
    points: v2[];

    constructor ({
        zLayer = 1,
        colour = 'rgb(150, 150, 150)',
        points = [v2.zero]
    }) {
        super('GUIPolygon', zLayer);

        this.colour = colour;
        this.points = points;
    }

    draw(ctx: CanvasRenderingContext2D, transform: Transform): void {
        if (this.points.length <= 1) return;

        polygon(ctx, scaleMesh(this.points, transform.scale), this.colour);
    }

    tick(): void {}

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        // quite hard to implement as a polygon is a very complex shape
        // very expensive calculation
        return polygonCollidingWithPoint(this.points, point);
    }
}

export class GUIImage extends GUIElement {
    width: number;
    height: number;
    url: string;

    constructor ({
        zLayer = 1,
        width =100,
        height = 100,
        url = '',
    }) {
        super('GUIImage', zLayer);

        this.width = width;
        this.height = height;
        this.url = url;
    }

    draw(ctx: CanvasRenderingContext2D, transform: Transform): void {
        const width = this.width * transform.scale.x;
        const height = this.height * transform.scale.y;

        if (height <= 0 || width <= 0) return;

        image(ctx, transform.position, new v2(width, height), this.url);
    }

    tick(): void {}

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        // quite hard to implement as a polygon is a very complex shape
        // very expensive calculation
        const width = this.width * transform.scale.x;
        const height = this.height * transform.scale.y;

        return point.isInRect(transform.position, new v2(width, height));
    }
}