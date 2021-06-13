import { JSONifyComponent } from "../../util/util.js";
import { Renderer } from "./renderComponents.js";
import { MeshV3 } from '../../util/maths/maths.js';
export class Renderer3D extends Renderer {
    constructor(type) {
        super(type, false);
    }
    tick() { }
    json() {
        return JSONifyComponent(this);
    }
}
export class MeshRenderer extends Renderer3D {
    constructor({ tris = new MeshV3([]), }) {
        super("CircleRenderer2D");
        this.tris = tris;
    }
    draw(transform, camera, ctx) {
    }
}
