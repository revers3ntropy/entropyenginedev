import {v2} from "../maths/maths.js";
import {circle, image, rect} from "../systems/rendering/basicShapes.js";
import {getZoomScaledPosition, JSONifyComponent} from '../util/general.js'
import {colour, rgb, rgba} from "../util/colour.js";
import { Transform } from "./transform.js";
import { Renderer } from "./renderer.js";

export abstract class Renderer2D extends Renderer {
    abstract draw (arg: {position: v2, transform: Transform, ctx: CanvasRenderingContext2D, zoom: number, center: v2}): void;
    
    // @ts-ignore
    offset: v2;
    
    protected constructor(type: string, offset: v2) {
        super(type, true);

        this.addPublic({
            name: 'offset',
            value: offset,
            type: 'v2',
            description: 'offset from entities transform'
        });
    }

    Update () {}

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
                    this.setPublic('colour', rgb.parse(value));
                    return;
                }
                this.setPublic('colour', value);
            }
        });
    }

    draw (arg: {position: v2, transform: Transform, ctx: CanvasRenderingContext2D, zoom: number, center: v2}): void {
        const radius = this.radius * arg.zoom * arg.transform.scale.x;
        if (radius <= 0) return;

        circle(arg.ctx, getZoomScaledPosition(arg.position.clone.add(this.offset), arg.zoom, arg.center), radius, this.colour.rgb);
    }
}

export class RectRenderer extends Renderer2D {
    Start(): void {}

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
            overrideSet: (value: string | colour | any) => {
                if (typeof value === 'string') {
                    this.setPublic('colour', rgb.parse(value));
                    return;
                } else if (typeof value.r === 'number') {
                    // raw json, so do last step of parsing it
                    this.setPublic('colour', rgba(value.r, value.g, value.b, value.a));
                    return;
                }

                this.setPublic('colour', value);
            }
        });
    }

    draw (arg: {position: v2, transform: Transform, ctx: CanvasRenderingContext2D, zoom: number, center: v2}): void {
        const width = this.width * arg.transform.scale.x * arg.zoom;
        const height = this.height * arg.transform.scale.y * arg.zoom;

        if (height <= 0 || width <= 0) return;

        let renderPos = this.offset.clone
            .add(arg.position);

        renderPos.sub(new v2(
            width / (arg.zoom * 2),
            height / (arg.zoom * 2)
        ));

        rect (arg.ctx,
            getZoomScaledPosition(renderPos, arg.zoom, arg.center),
            width, height, this.colour.rgb,
            arg.transform.rotation.z
        );
    }
}

export class ImageRenderer2D extends Renderer2D {
    Start(): void {}

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
            description: 'The path to the image to be rendered - always start with ../projects/{yourProjectID}/assets/',
        });
    }

    draw (arg: {position: v2, transform: Transform, ctx: CanvasRenderingContext2D, zoom: number, center: v2}): void {
        const width = this.width * arg.transform.scale.x * arg.zoom;
        const height = this.height * arg.transform.scale.y * arg.zoom;

        if (height <= 0 || width <= 0) return;

        let renderPos = this.offset.clone
            .add(arg.position);

        renderPos.sub(new v2(
            width / (arg.zoom * 2),
            height / (arg.zoom * 2)
        ));

        image (
            arg.ctx,
            getZoomScaledPosition(renderPos, arg.zoom, arg.center),
            new v2(width, height),
            this.url,
            arg.transform.rotation.z
        );
    }
}