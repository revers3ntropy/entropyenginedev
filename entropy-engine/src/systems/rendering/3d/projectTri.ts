import {Entity} from "../../../ECS/entity.js";
import {v3} from "../../../maths/maths.js";
import {Camera} from "../../../components/camera.js";
import {Mat4} from "../../../maths/matrix.js";
import {TriangleV3} from "../../../maths/triangleV3";

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

export function rotation (pitch: number, yaw: number, roll: number) {
    let matrix = new Mat4();

    let a = yaw;
    let b = pitch;
    let c = roll;

    let cosA = Math.cos(a);
    let cosB = Math.cos(b);
    let cosC = Math.cos(c);

    let sinA = Math.sin(a);
    let sinB = Math.sin(b);
    let sinC = Math.sin(c);

    // formulae source: http://planning.cs.uiuc.edu/node102.html
    matrix.m = [
        [ cosA * cosB,   cosA * cosB * sinC - sinA * cosC,   cosA * sinB * cosC + sinA * sinC,   0 ],
        [ sinA * cosB,   sinA * sinB * sinC + cosA * cosC,   sinA * sinB * cosC - cosA * sinC,   0 ],
        [ -sinB,         cosB * sinC,                        cosB * cosC,                        0 ],
        [ 0,              0,                                  0,                                 1 ]
    ];

    return matrix;
}

export function project3D (ctx: CanvasRenderingContext2D, camera: Entity, tri: TriangleV3, rotationMatrix: Mat4) {
    tri = tri.clone;
    const screenHeight = ctx.canvas.height;
    const screenWidth = ctx.canvas.width;
    const canvas = ctx.canvas;
    const aspectRatio = canvas.height / canvas.width;
    const camComponent = camera.getComponent<Camera>('Camera');

    const proj = projMat(camComponent, aspectRatio);
    // transform position
    //tri.move(camera.transform.position.negative);
    tri.apply(t => rotationMatrix.transformV3(t));
    tri.move(new v3(0, 0, 3));
    // project to 3D
    tri.apply(p => proj.transformV3(p));
    // scale into view

    tri.points[0].x += 1.0;
    tri.points[0].y += 1.0;
    tri.points[1].x += 1.0;
    tri.points[1].y += 1.0;
    tri.points[2].x += 1.0;
    tri.points[2].y += 1.0;
    tri.points[0].x *= screenWidth / 2;
    tri.points[0].y *= screenHeight / 2;
    tri.points[1].x *= screenWidth / 2;
    tri.points[1].y *= screenHeight / 2;
    tri.points[2].x *= screenWidth / 2;
    tri.points[2].y *= screenHeight / 2;
    return tri;
}