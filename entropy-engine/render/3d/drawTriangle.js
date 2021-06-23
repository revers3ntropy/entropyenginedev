import * as draw from "../renderer.js";
export function wireframe(triangle, ctx, camera) {
    const tri = triangle.clone.project3D(ctx, camera);
    draw.polygon(ctx, tri.triangleV2.points, 'rgb(0, 0, 0)', false);
}
