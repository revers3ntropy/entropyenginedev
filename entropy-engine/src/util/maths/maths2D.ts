import {v3} from './maths3D.js';

export class v2 {
    x: number;
    y: number;

    constructor(x: number, y: number = x) {
        this.x = x;
        this.y = y;
    }

    add (v: v2): v2 {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub (v: v2): v2 {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mul (v: v2): v2 {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }

    scale (factor: number): v2 {
        this.x *= factor;
        this.y *= factor;
        return this;
    }

    div (v: v2): v2 {

        if (v.x !== 0)
            this.x /= v.x;

        if (v.y !== 0)
            this.y /= v.y;

        return this;
    }

    distTo (v: v2): number {
        return Math.sqrt(
            (this.x - v.x) ** 2 +
            (this.y - v.y) ** 2
        );
    }

    diff (v: v2) {
        return new v2(
            Math.abs(this.x - v.x),
            Math.abs(this.y - v.y)
        );
    }

    get magnitude (): number {
        return Math.sqrt(
            this.x ** 2 +
            this.y ** 2
        );
    }

    normalise (): v2 {
        const m = this.magnitude;

        if (m !== 0)
            this.scale(1/m);
        else
            console.error(`Cannot normalise vector with magnitude 0`);

        return this;
    }

    get clone (): v2 {
        return new v2(this.x, this.y);
    }

    get angle (): number {
        return -Math.atan2(-this.y, this.x);
    }

    get str (): string {
        return `x: ${this.x} \ny: ${this.y}`;
    }

    equals (v: v2): boolean {
        return (
            v.x === this.x &&
            v.y === this.y
        )
    }

    isInRect (rectPos: v2, rectDimensions: v2): boolean {
        return (
            this.x > rectPos.x &&
            this.x < rectPos.x + rectDimensions.x &&
            this.y > rectPos.y &&
            this.y < rectPos.y + rectDimensions.y
        );
    }

    set (to: v2): v2 {
        this.x = to.x;
        this.y = to.y;
        return this;
    }

    apply (m: (v: number) => number) {
        this.x = m(this.x);
        this.y = m(this.y);
    }

    dot (v: v2): number {
        return this.x * v.x + this.y * v.y;
    }
    cross (v: v2): number {
        return this.x * v.y - this.y * v.x;
    }

    get negative (): v2 {
        return this.clone.scale(-1);
    }

    toInt (): v2 {
        this.apply(Math.round);
        return this;
    }
    
    get v3 (): v3 {
        return new v3(this.x, this.y, 0);
    }

    get array (): number[] {
        return [this.x, this.y];
    }

    static fromArray (arr: any) {
        return new v2(arr[0], arr[1]);
    }


    static get up () {
        return new v2(0, 1);
    }
    static get down (){
        return new v2(0, -1);
    }
    static get right (){
        return new v2(1, 0);
    }
    static get left (){
        return new v2(-1, 0);
    }

    static get zero (){
        return new v2(0, 0);
    }

    static avPoint(points: v2[]) {
        let total = v2.zero;

        for (let point of points)
            total.add(point);

        return total.scale(1/points.length);
    }
}

export class TriangleV2 {

    points: [v2, v2, v2];

    constructor (points: [v2, v2, v2]) {
        this.points = points;
    }

    move (by: v2) {
        for (const point of this.points) {
            point.add(by);
        }
    }
}

export class MeshV2 {

    triangles: TriangleV2[];

    constructor (Triangles: TriangleV2[]) {
        this.triangles = Triangles;
    }

    move (by: v2) {
        for (const tri of this.triangles) {
            tri.move(by);
        }
    }
}