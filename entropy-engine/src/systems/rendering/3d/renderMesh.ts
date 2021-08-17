import {Entity} from "../../../ECS/entity.js";
import {MeshV3} from "../../../maths/meshV3.js";
import {Transform} from "../../../components/transform.js";
import {project3D, rotation} from "./projectTri.js";
import * as draw from "../basicShapes.js";
import {Mat4} from "../../../maths/matrix.js";

export enum renderMode {
    WIREFRAME,
    TEXTURE
}

let elapsedTime = 0;

export function drawMesh (mesh_: MeshV3, mode: renderMode, ctx: CanvasRenderingContext2D, camera: Entity, transform: Transform) {
    const rotationMatrix = rotation(
        transform.rotation.x + camera.transform.rotation.x + elapsedTime,
        transform.rotation.y + camera.transform.rotation.y + elapsedTime,
        transform.rotation.z + camera.transform.rotation.z
    );

    elapsedTime += 0.001;

    const mesh = mesh_.clone;
    //mesh.move(camera.transform.position);
    mesh.move(transform.position);

    for (let tri of mesh.triangles) {
        tri = project3D(ctx, camera, tri, rotationMatrix);

        switch (mode) {
            case renderMode.WIREFRAME:
                draw.polygon(ctx, tri.triangleV2.points, 'rgb(0, 0, 0)', false, 0);
                break;
            default:
                console.error(`Unknown render mode: ${mode}`);
                break;
        }
    }
}