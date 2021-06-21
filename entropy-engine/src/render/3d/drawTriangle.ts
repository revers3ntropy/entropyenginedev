import {TriangleV3} from "../../util/maths/maths3D.js";
import {Sprite} from "../../ECS/sprite.js";
import * as draw from "../renderer.js";

export function wireframe (triangle: TriangleV3, ctx: CanvasRenderingContext2D, camera: Sprite) {
    const tri = triangle.clone.project3D(ctx, camera);
    draw.polygon(ctx, tri.triangleV2.points, 'rgb(0, 0, 0)', false);
}