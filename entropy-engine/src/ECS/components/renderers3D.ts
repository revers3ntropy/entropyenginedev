import {JSONifyComponent} from "../../util/util.js";
import {Transform} from "../transform.js";
import {Renderer} from "./renderComponents.js";
import {MeshV3} from '../../util/maths/maths.js';
import {Sprite} from "../sprite.js";
import {drawMesh, renderMode} from "../../render/3d/renderMesh.js";
import {Mat4} from "../../util/maths/matrix.js";

export abstract class Renderer3D extends Renderer {
    abstract draw (arg: {
       transform: Transform,
       ctx: CanvasRenderingContext2D,
       cameraSprite: Sprite
   }): void;
    
    protected constructor(type: string) {
        super(type, false);
    }

    tick () {}

    json () {
        return JSONifyComponent(this);
    }
}

export class MeshRenderer extends Renderer3D {
    mesh: MeshV3;

    constructor ({
         mesh = new MeshV3([]),
     }) {
        super("MeshRenderer");

        this.mesh = mesh;
    }

    draw (arg: {
        transform: Transform,
        ctx: CanvasRenderingContext2D,
        cameraSprite: Sprite
    }): void {
        let mesh = new MeshV3([]);
        const rot = arg.transform.rotation;

        for (let tri of this.mesh.triangles) {
            tri = tri.clone;
            tri.apply (p => {
                return p.transform(Mat4.rotation(rot.x, rot.y, rot.z));
            });
            mesh.triangles.push(tri);
        }

        drawMesh(mesh, renderMode.WIREFRAME, arg.ctx, arg.cameraSprite);
    }
}