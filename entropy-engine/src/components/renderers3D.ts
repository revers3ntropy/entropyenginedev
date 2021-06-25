import {Transform} from "./transform.js";
import {Renderer} from "./renderComponents.js";
import {MeshV3} from '../util/maths/maths.js';
import {Sprite} from "../ECS/sprite.js";
import {drawMesh, renderMode} from "../render/3d/renderMesh.js";
import {Mat4} from "../util/maths/matrix.js";
import {MeshArr} from "../util/maths/maths3D.js";

export abstract class Renderer3D extends Renderer {
    abstract draw (arg: {
       transform: Transform,
       ctx: CanvasRenderingContext2D,
       cameraSprite: Sprite
   }): void;
    
    protected constructor(type: string) {
        super(type, false);
    }

    Update () {}
}

export class MeshRenderer extends Renderer3D {
    Start(transform: Transform): void {
    }
    _mesh: MeshV3;

    constructor ({
         mesh = new MeshV3([]),
     }) {
        super("MeshRenderer");

        this._mesh = mesh;
    }

    // @ts-ignore - get and set have different types
    get mesh (): MeshV3 {
        return this._mesh;
    }

    // @ts-ignore - get and set have different types
    set mesh (val: MeshV3 | MeshArr) {
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

    draw (arg: {
        transform: Transform,
        ctx: CanvasRenderingContext2D,
        cameraSprite: Sprite
    }): void {
        let mesh = new MeshV3([]);
        const rot = arg.transform.rotation;
        const rotMat = Mat4.rotation(rot.x, rot.y, rot.z);

        for (let tri of this.mesh.triangles) {
            tri = tri.clone;
            tri.apply (p => rotMat.transformV3(p));
            mesh.triangles.push(tri);
        }

        drawMesh(mesh, renderMode.WIREFRAME, arg.ctx, arg.cameraSprite);
    }

    json () {
        return {
            type: 'MeshRenderer',
            mesh: this.mesh.json
        }
    }
}