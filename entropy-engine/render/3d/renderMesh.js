import * as drawTri from './drawTriangle.js';
export var renderMode;
(function (renderMode) {
    renderMode[renderMode["WIREFRAME"] = 0] = "WIREFRAME";
    renderMode[renderMode["TEXTURE"] = 1] = "TEXTURE";
})(renderMode || (renderMode = {}));
export function drawMesh(mesh, mode, ctx, camera) {
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
