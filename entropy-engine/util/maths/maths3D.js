import { TriangleV2, v2 } from './maths2D.js';
import { Mat4 } from "./matrix.js";
export class v3 {
    constructor(x, y = x, z = x, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    add(v) {
        this.x += (v === null || v === void 0 ? void 0 : v.x) || 0;
        this.y += (v === null || v === void 0 ? void 0 : v.y) || 0;
        this.z += (v === null || v === void 0 ? void 0 : v.z) || 0;
        return this;
    }
    sub(v) {
        this.x -= v.x || 0;
        this.y -= v.y || 0;
        this.z -= v.z || 0;
        return this;
    }
    mul(v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }
    scale(factor) {
        this.x *= factor;
        this.y *= factor;
        this.z *= factor;
        return this;
    }
    div(v) {
        if (v.x !== 0)
            this.x /= v.x;
        if (v.y !== 0)
            this.y /= v.y;
        if (v.z !== 0)
            this.z /= v.z;
        return this;
    }
    distTo(v) {
        return this.clone.sub(v).magnitude;
    }
    diff(v) {
        return new v3(Math.abs(this.x - v.x), Math.abs(this.y - v.y), Math.abs(this.z - v.z));
    }
    get magnitude() {
        let dot = Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2);
        if (dot === 0)
            return 0;
        return Math.sqrt(dot);
    }
    normalise() {
        const m = this.magnitude;
        if (m !== 0)
            this.scale(1 / m);
        else
            console.error(`Cannot normalise vector with magnitude 0`);
        return this;
    }
    get clone() {
        return new v3(this.x, this.y, this.z);
    }
    get str() {
        return `x: ${this.x} \ny: ${this.y} \nz: ${this.z}`;
    }
    equals(v) {
        return (v.x === this.x &&
            v.y === this.y &&
            v.z === this.z);
    }
    isInCuboid(rectPos, rectDimensions) {
        /*
         Checks to see if the point is inside the top, right and front face of the cuboid,
         and if it is in all three then it is inside the cuboid
         */
        return (
        // front (x, y)
        (new v2(this.x, this.y)).isInRect(new v2(rectPos.x, rectPos.y), new v2(rectDimensions.x, rectDimensions.y)) &&
            // right (y, z)
            (new v2(this.y, this.z)).isInRect(new v2(rectPos.y, rectPos.z), new v2(rectDimensions.y, rectDimensions.z)) &&
            // top (x, z)
            (new v2(this.x, this.z)).isInRect(new v2(rectPos.x, rectPos.z), new v2(rectDimensions.x, rectDimensions.z)));
    }
    set(to) {
        this.x = to.x;
        this.y = to.y;
        this.z = to.z;
        return this;
    }
    apply(m) {
        this.x = m(this.x);
        this.y = m(this.y);
        this.z = m(this.z);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    cross(v) {
        return this.x * v.y - this.y * v.x - this.z * v.z;
    }
    get negative() {
        return this.clone.scale(-1);
    }
    toInt() {
        this.apply(Math.round);
        return this;
    }
    get v2() {
        return new v2(this.x, this.y);
    }
    get array() {
        return [this.x, this.y, this.z];
    }
    transform(m) {
        this.x = this.x * m.m[0][0] + this.y * m.m[1][0] + this.z * m.m[2][0] + m.m[3][0];
        this.y = this.x * m.m[0][1] + this.y * m.m[1][1] + this.z * m.m[2][1] + m.m[3][1];
        this.z = this.x * m.m[0][2] + this.y * m.m[1][2] + this.z * m.m[2][2] + m.m[3][2];
        return this;
    }
    //      STATIC
    static get up() {
        return new v3(0, 1, 0);
    }
    static get down() {
        return new v3(0, -1, 0);
    }
    static get right() {
        return new v3(1, 0, 0);
    }
    static get left() {
        return new v3(-1, 0, 0);
    }
    static get forward() {
        return new v3(0, 0, 1);
    }
    static get back() {
        return new v3(0, 0, -1);
    }
    static get zero() {
        return new v3(0, 0, 0);
    }
    static avPoint(points) {
        let total = v3.zero;
        for (let point of points)
            total.add(point);
        return total.scale(1 / points.length);
    }
    static fromArray(arr) {
        return new v3(arr[0], arr[1], arr[2]);
    }
}
export class TriangleV3 {
    constructor(p1, p2, p3) {
        this.points = [p1, p2, p3];
    }
    move(by) {
        for (const point of this.points) {
            point.add(by);
        }
    }
    apply(cb) {
        for (let i = 0; i < 3; i++) {
            this.points[i] = cb(this.points[i].clone);
        }
    }
    get clone() {
        return new TriangleV3(this.points[0].clone, this.points[1].clone, this.points[2].clone);
    }
    get triangleV2() {
        return new TriangleV2([
            this.points[0].v2,
            this.points[1].v2,
            this.points[2].v2
        ]);
    }
    project3D(ctx, camera) {
        const canvas = ctx.canvas;
        const aspectRatio = canvas.height / canvas.width;
        const camComponent = camera.getComponent('Camera');
        // transform position
        this.move(camera.transform.position);
        //this.move(new v3(3, 3, 3));
        // project to 3D
        this.apply(p => p.transform(Mat4.projection(camComponent, aspectRatio)));
        // scale into view
        this.apply(p => {
            p.add(new v3(1, 1, 0));
            p.mul(new v3(canvas.width / 2, canvas.height / 2, 1));
            return p;
        });
        return this;
    }
}
export class MeshV3 {
    constructor(Triangles) {
        this.triangles = Triangles;
    }
    move(by) {
        for (const tri of this.triangles) {
            tri.move(by);
        }
    }
    // basic shapes
    static get cube() {
        return new MeshV3([
            // SOUTH
            new TriangleV3(new v3(0, 0, 0, 1), new v3(0, 1, 0, 1), new v3(1, 1, 0, 1)),
            new TriangleV3(new v3(0, 0, 0, 1), new v3(1, 1, 0, 1), new v3(1, 0, 0, 1)),
            // EAST
            new TriangleV3(new v3(1, 0, 0, 1), new v3(1, 1, 0, 1), new v3(1, 1, 1, 1)),
            new TriangleV3(new v3(1, 0, 0, 1), new v3(1, 1, 1, 1), new v3(1, 0, 1, 1)),
            // NORTH
            new TriangleV3(new v3(1, 0, 1, 1), new v3(1, 1, 1, 1), new v3(0, 1, 1, 1)),
            new TriangleV3(new v3(1, 0, 1, 1), new v3(0, 1, 1, 1), new v3(0, 0, 1, 1)),
            // WEST
            new TriangleV3(new v3(0, 0, 1, 1), new v3(0, 1, 1, 1), new v3(0, 1, 0, 1)),
            new TriangleV3(new v3(0, 0, 1, 1), new v3(0, 1, 0, 1), new v3(0, 0, 0, 1)),
            // TOP
            new TriangleV3(new v3(0, 1, 0, 1), new v3(0, 1, 1, 1), new v3(1, 1, 1, 1)),
            new TriangleV3(new v3(0, 1, 0, 1), new v3(1, 1, 1, 1), new v3(1, 1, 0, 1)),
            // BOTTOM
            new TriangleV3(new v3(1, 0, 1, 1), new v3(0, 0, 1, 1), new v3(0, 0, 0, 1)),
            new TriangleV3(new v3(1, 0, 1, 1), new v3(0, 0, 0, 1), new v3(1, 0, 0, 1)),
        ]);
    }
}
