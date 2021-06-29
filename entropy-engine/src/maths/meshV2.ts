import {TriangleV2} from "./triangleV2";
import {v2} from "./v2";

export class MeshV2 {

    triangles: TriangleV2[];

    constructor(Triangles: TriangleV2[]) {
        this.triangles = Triangles;
    }

    move(by: v2) {
        for (const tri of this.triangles) {
            tri.move(by);
        }
    }
}