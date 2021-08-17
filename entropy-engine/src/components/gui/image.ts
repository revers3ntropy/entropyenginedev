import {Transform} from "../transform.js";
import {image} from "../../systems/rendering/basicShapes.js";
import {GUIElement} from "./gui.js";
import {v2} from "../../maths/v2.js";

export class GUIImage extends GUIElement {
    Start(transform: Transform): void {
    }
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

        image(ctx, transform.position.v2, new v2(width, height), this.url, transform.rotation.z);
    }

    Update(): void {}

    touchingPoint (point: v2, ctx: CanvasRenderingContext2D, transform: Transform): boolean {
        // quite hard to implement as a polygon is a very complex shape
        // very expensive calculation
        const width = this.width * transform.scale.x;
        const height = this.height * transform.scale.y;

        return point.isInRect(transform.position.v2, new v2(width, height));
    }
}