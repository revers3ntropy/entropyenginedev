import { JSONifyComponent } from "../../util/util.js";
import { Renderer } from "./renderComponents.js";
import { MeshV3 } from '../../util/maths/maths.js';
import { drawMesh, renderMode } from "../../render/3d/renderMesh.js";
import { Mat4 } from "../../util/maths/matrix.js";
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
    constructor({ mesh = new MeshV3([]), }) {
        super("MeshRenderer");
        this.mesh = mesh;
    }
    draw(arg) {
        let mesh = new MeshV3([]);
        const rot = arg.transform.rotation;
        for (let tri of this.mesh.triangles) {
            tri = tri.clone;
            tri.apply(p => {
                return p.transform(Mat4.rotation(rot.x, rot.y, rot.z));
            });
            mesh.triangles.push(tri);
        }
        drawMesh(mesh, renderMode.WIREFRAME, arg.ctx, arg.cameraSprite);
    }
}
