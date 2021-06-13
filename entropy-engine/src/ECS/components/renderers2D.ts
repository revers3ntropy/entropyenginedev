import {Component} from "../component.js";
import {v2} from "../../util/maths/maths.js";
import {circle, image, rect} from "../../render/renderer.js";
import {Sprite} from "../sprite.js";
import {GUIElement} from "./gui.js";
import {Camera} from "./camera.js";
import {getCanvasSize, getZoomScaledPosition, JSONifyComponent} from '../../util/util.js'
import {colour, parseColour, rgb } from "../../util/colour.js";
import { Transform } from "../transform.js";
import { Renderer } from "./renderer.js";

export abstract class Renderer2D extends Renderer {
    abstract draw (renderPos: v2, transform: Transform, ctx: CanvasRenderingContext2D, cameraZoom: number, center: v2): void;
    
    // @ts-ignore
    offset: v2;
    
    protected constructor(type: string, offset: v2) {
        super(type, true);

        this.addPublic({
            name: 'offset',
            value: offset,
            type: 'v2',
            description: 'offset from sprites transform'
        });
    }

    tick () {}

    json () {
        return JSONifyComponent(this);
    }
}

export class CircleRenderer extends Renderer2D {
    // @ts-ignore
    radius: number;
    // @ts-ignore
    colour: colour;

    constructor ({
         radius = 1,
         offset = new v2(0, 0),
         colour = rgb(0, 0, 0)
     }) {
        super("CircleRenderer", offset);

        this.addPublic({
            name: 'radius',
            value: radius,
            type: 'number',
            array: false
        });

        this.addPublic({
            name: 'colour',
            value: colour,
            type: 'rgb',
            overrideSet: (value) => {
                if (typeof value === 'string') {
                    this.setPublic('colour', parseColour(value));
                    return;
                }
                this.setPublic('colour', value);
            }
        });
    }

    draw (position: v2, transform: Transform, ctx: CanvasRenderingContext2D, cameraZoom: number, center: v2): void {
        const radius = this.radius * cameraZoom * transform.scale.x;
        if (radius <= 0) return;

        circle(ctx, getZoomScaledPosition(position.clone.add(this.offset), cameraZoom, center), radius, this.colour.rgb);
    }
}

export class RectRenderer extends Renderer2D {

    // @ts-ignore
    height: number;
    // @ts-ignore
    width: number;
    // @ts-ignore
    colour: colour;

    constructor ({
                     height = 1,
                     offset = new v2(0, 0),
                     width= 1,
                     colour = rgb(0, 0, 0),
                 }) {
        super("RectRenderer", offset);

        this.addPublic({
            name: 'height',
            value: height,
        });

        this.addPublic({
            name: 'width',
            value: width,
        });

        this.addPublic({
            name: 'colour',
            value: colour,
            type: 'rgb',
            overrideSet: (value) => {
                if (typeof value === 'string') {
                    this.setPublic('colour', parseColour(value));
                    return;
                }
                this.setPublic('colour', value);
            }
        });
    }

    draw (position: v2, transform: Transform, ctx: CanvasRenderingContext2D, cameraZoom: number, center: v2): void {
        const width = this.width * transform.scale.x * cameraZoom;
        const height = this.height * transform.scale.y * cameraZoom;

        if (height <= 0 || width <= 0) return;

        let renderPos = this.offset.clone
            .add(position);

        rect (ctx, getZoomScaledPosition(renderPos, cameraZoom, center), width, height, this.colour.rgb);
    }
}

export class ImageRenderer2D extends Renderer2D {

    // @ts-ignore
    height: number;
    // @ts-ignore
    width: number;
    // @ts-ignore
    url: string;

    constructor ({
                     height = 1,
                     offset = new v2(0, 0),
                     width= 1,
                     url= '',
                 }) {
        super("ImageRenderer2D", offset);

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
            type: 'string',
            description: 'The path to the image to be rendered - relative to /assets/ or /build/asssets/',
        });
    }

    draw (position: v2, transform: Transform, ctx: CanvasRenderingContext2D, cameraZoom: number, center: v2): void {
        const width = this.width * transform.scale.x * cameraZoom;
        const height = this.height * transform.scale.y * cameraZoom;

        if (height <= 0 || width <= 0) return;

        let renderPos = this.offset.clone
            .add(position);

        image (ctx, getZoomScaledPosition(renderPos, cameraZoom, center), new v2(width, height).scale(cameraZoom), this.url);
    }
}