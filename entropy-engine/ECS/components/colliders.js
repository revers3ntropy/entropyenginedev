import { Component } from "../component.js";
import { v2 } from "../../util/maths/maths.js";
import { JSONifyComponent } from "../../util/util.js";
export class Collider extends Component {
    constructor(subtype, solid, offset) {
        super("Collider", subtype);
        this.addPublic({
            name: 'solid',
            value: solid,
            description: 'If the collider should interact with other colliders or not',
            default: true
        });
        this.addPublic({
            name: 'offset',
            value: offset,
            type: 'v2',
            description: 'Offsets the renderer from the transform of the sprite',
            default: v2.zero
        });
    }
    json() {
        return JSONifyComponent(this);
    }
}
export class CircleCollider extends Collider {
    constructor({ radius = 1, solid = true, offset = new v2(0, 0), }) {
        super("CircleCollider", solid, offset);
        this.addPublic({
            name: 'radius',
            value: radius,
            default: 1
        });
    }
    tick() { }
    overlapsPoint(transform, point) {
        return point.distTo(transform.position.clone.v2
            .add(this.offset)) <= this.radius * transform.scale.x;
    }
}
export class RectCollider extends Collider {
    constructor({ width = 1, height = 1, solid = true, offset = new v2(0, 0) }) {
        super("RectCollider", solid, offset);
        this.addPublic({
            name: 'height',
            value: height
        });
        this.addPublic({
            name: 'width',
            value: width
        });
    }
    tick() { }
    overlapsPoint(transform, point) {
        return point.isInRect(transform.position.clone.v2
            .add(this.offset), new v2(this.width * transform.scale.x, this.height * transform.scale.y));
    }
}
