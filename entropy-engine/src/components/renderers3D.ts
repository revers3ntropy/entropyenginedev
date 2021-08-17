import {Transform} from "./transform.js";
import {Renderer} from "./renderer.js";
import {MeshV3} from '../maths/maths.js';
import {Entity} from "../ECS/entity.js";
import {drawMesh, renderMode} from "../systems/rendering/3d/renderMesh.js";
import {MeshArr} from "../maths/maths.js";

export abstract class Renderer3D extends Renderer {
    abstract draw (arg: {
       transform: Transform,
       ctx: CanvasRenderingContext2D,
       cameraSprite: Entity
   }): void;
    
    protected constructor(type: string) {
        super(type, false);
    }

    Update () {}
}

export class MeshRenderer extends Renderer3D {
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
        cameraSprite: Entity
    }): void {
        drawMesh(this.mesh, renderMode.WIREFRAME, arg.ctx, arg.cameraSprite, arg.transform);
    }

    json () {
        return {
            type: 'MeshRenderer',
            mesh: this.mesh.json
        }
    }
}