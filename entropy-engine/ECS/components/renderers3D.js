import { Renderer } from "./renderComponents.js";
import { MeshV3 } from '../../util/maths/maths.js';
import { drawMesh, renderMode } from "../../render/3d/renderMesh.js";
import { Mat4 } from "../../util/maths/matrix.js";
export class Renderer3D extends Renderer {
    constructor(type) {
        super(type, false);
    }
    tick() { }
}
export class MeshRenderer extends Renderer3D {
    constructor({ mesh = new MeshV3([]), }) {
        super("MeshRenderer");
        this._mesh = mesh;
    }
    // @ts-ignore - get and set have different types
    get mesh() {
        return this._mesh;
    }
    // @ts-ignore - get and set have different types
    set mesh(val) {
        if (val instanceof MeshV3) {
            this._mesh = val;
            return;
        }
        /*
        Array structure:
        [ mesh
          [ triangle
            [n, n, n],
            [n, n, n],
            [n, n, n],
          ],
        ]
         */
        this._mesh = MeshV3.fromArray(val);
    }
    draw(arg) {
        let mesh = new MeshV3([]);
        const rot = arg.transform.rotation;
        for (let tri of this.mesh.triangles) {
            tri = tri.clone;
            tri.apply(p => p.transform(Mat4.rotation(rot.x, rot.y, rot.z)));
            mesh.triangles.push(tri);
        }
        drawMesh(mesh, renderMode.WIREFRAME, arg.ctx, arg.cameraSprite);
    }
    json() {
        return {
            type: 'MeshRenderer',
            mesh: this.mesh.json
        };
    }
}
