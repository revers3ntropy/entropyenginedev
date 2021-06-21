import {MeshV3} from "../../util/maths/maths3D.js";
import * as drawTri from './drawTriangle.js';
import {Sprite} from "../../ECS/sprite";

export enum renderMode {
    WIREFRAME,
    SOLID,
    TEXTURE
}

export function drawMesh (mesh: MeshV3, mode: renderMode, ctx: CanvasRenderingContext2D, camera: Sprite) {
    for (let tri of mesh.triangles) {
        switch (mode) {
            case renderMode.WIREFRAME:
                drawTri.wireframe(tri, ctx, camera);
                break;
            default:
                console.error(`Unknown render mode: ${mode}`);
                break;
        }
    }
}