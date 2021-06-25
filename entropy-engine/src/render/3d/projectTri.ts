import {Sprite} from "../../ECS/sprite.js";
import {TriangleV3, v3} from "../../util/maths/maths3D.js";
import {Camera} from "../../components/camera.js";
import {Mat4} from "../../util/maths/matrix.js";

export function projMat (camera: Camera, aspectRatio: number) {
    const fovRad = 1 / Math.tan(camera.fov * 0.5 / 180 * 3.14159);

    const m = new Mat4();

    m.m[0][0] = aspectRatio * fovRad;
    m.m[1][1] = fovRad;
    m.m[2][2] = camera.far / (camera.far - camera.near);
    m.m[3][2] = (-camera.far * camera.near) / (camera.far - camera.near);
    m.m[2][3] = 1;
    m.m[3][3] = 0;

    return m;
}

export function project3D (ctx: CanvasRenderingContext2D, camera: Sprite, to: TriangleV3) {
    to = to.clone;
    const canvas = ctx.canvas;
    const aspectRatio = canvas.height / canvas.width;

    const camComponent = camera.getComponent<Camera>('Camera');
    const proj = projMat(camComponent, aspectRatio);

    // transform position
    to.move(camera.transform.position);
    //this.move(new v3(3, 3, 3));

    // project to 3D
    to.apply (p => proj.transformV3(p));

    // scale into view
    to.apply(p => {
        p.add(new v3(1, 1, 0));
        p.mul(new v3(canvas.width / 2, canvas.height / 2, 1));
        return p;
    });

    return to;
}