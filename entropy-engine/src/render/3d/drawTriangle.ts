import {TriangleV3} from "../../util/maths/maths3D.js";
import {Sprite} from "../../ECS/sprite.js";
import * as draw from "../renderer.js";
import {project3D} from "./projectTri.js";

export function wireframe (triangle: TriangleV3, ctx: CanvasRenderingContext2D, camera: Sprite) {
    const tri = project3D(ctx, camera, triangle);
    draw.polygon(ctx, tri.triangleV2.points, 'rgb(0, 0, 0)', false);
}