import {rgb} from "../../util/colour.js";
import {Transform} from "../transform.js";
import {circle} from "../../render/renderer.js";
import {v2} from "../../util/maths/maths2D.js";
import {GUIElement} from "./gui.js";

export class GUICircle extends GUIElement {
    Start(transform: Transform): void {
    }
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

    Update(): void {}

    touchingPoint(point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        return point.clone.distTo(transform.position.v2) <= this.radius * transform.scale.x;
    }
}