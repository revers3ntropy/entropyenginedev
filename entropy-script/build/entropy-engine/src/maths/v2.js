import { v3 } from "./v3.js";
export class v2 {
    constructor(x, y = x) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    mul(v) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }
    scale(factor) {
        this.x *= factor;
        this.y *= factor;
        return this;
    }
    div(v) {
        if (v.x !== 0)
            this.x /= v.x;
        if (v.y !== 0)
            this.y /= v.y;
        return this;
    }
    distTo(v) {
        return Math.sqrt(Math.pow((this.x - v.x), 2) +
            Math.pow((this.y - v.y), 2));
    }
    diff(v) {
        return new v2(Math.abs(this.x - v.x), Math.abs(this.y - v.y));
    }
    get magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) +
            Math.pow(this.y, 2));
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
        return new v2(this.x, this.y);
    }
    get angle() {
        return -Math.atan2(-this.y, this.x);
    }
    get str() {
        return `x: ${this.x} \ny: ${this.y}`;
    }
    equals(v) {
        return (v.x === this.x &&
            v.y === this.y);
    }
    isInRect(rectPos, rectDimensions) {
        return (this.x > rectPos.x &&
            this.x < rectPos.x + rectDimensions.x &&
            this.y > rectPos.y &&
            this.y < rectPos.y + rectDimensions.y);
    }
    set(to) {
        this.x = to.x;
        this.y = to.y;
        return this;
    }
    apply(m) {
        this.x = m(this.x);
        this.y = m(this.y);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    get negative() {
        return this.clone.scale(-1);
    }
    toInt() {
        this.apply(Math.round);
        return this;
    }
    get v3() {
        return new v3(this.x, this.y, 0);
    }
    get array() {
        return [this.x, this.y];
    }
    static fromArray(arr) {
        return new v2(arr[0], arr[1]);
    }
    static get up() {
        return new v2(0, 1);
    }
    static get down() {
        return new v2(0, -1);
    }
    static get right() {
        return new v2(1, 0);
    }
    static get left() {
        return new v2(-1, 0);
    }
    static get zero() {
        return new v2(0, 0);
    }
    static avPoint(points) {
        let total = v2.zero;
        for (let point of points)
            total.add(point);
        return total.scale(1 / points.length);
    }
}
