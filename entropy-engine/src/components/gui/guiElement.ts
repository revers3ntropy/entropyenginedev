import {Component} from "../../ECS/component.js";
import {Transform} from "../transform.js";
import {v2} from "../../maths/maths.js";
import {JSONifyComponent} from "../../util/general.js";

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
        });

    }

    json () {
        return JSONifyComponent(this);
    }
}