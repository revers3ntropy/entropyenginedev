import { v2 } from "./v2.js";
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
