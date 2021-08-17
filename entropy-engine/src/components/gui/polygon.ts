import {rgb} from "../../util/colour.js";
import {Transform} from "../transform.js";
import {polygon} from "../../systems/rendering/basicShapes.js";
import {scaleMeshV2} from "../../util/general.js";
import {polygonCollidingWithPoint, v2} from "../../maths/maths.js";
import {GUIElement} from "./gui.js";

export class GUIPolygon extends GUIElement {
    // @ts-ignore
    colour: colour;
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

    draw (ctx: CanvasRenderingContext2D, transform: Transform): void {
        if (this.points.length <= 1) return;

        polygon(ctx, scaleMeshV2(this.points, transform.scale.v2), this.colour.hex, true, transform.rotation.z);
    }

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        // quite hard to implement as a polygon is a very complex shape
        // very expensive calculation
        return polygonCollidingWithPoint(this.points, point);
    }
}