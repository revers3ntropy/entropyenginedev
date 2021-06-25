import {TriangleV2, v2} from './maths2D.js';

export class v3 {
    x: number;
    y: number;
    z: number;

    w: number;

    constructor(x: number, y: number = x, z: number = x, w=1) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.w = w;
    }

    add (v: v3): v3 {
        this.x += v?.x || 0;
        this.y += v?.y || 0;
        this.z += v?.z || 0;
        return this;
    }

    sub (v: v3): v3 {
        this.x -= v.x || 0;
        this.y -= v.y || 0;
        this.z -= v.z || 0;
        return this;
    }

    mul (v: v3): v3 {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }

    scale (factor: number): v3 {
        this.x *= factor;
        this.y *= factor;
        this.z *= factor;
        return this;
    }

    div (v: v3): v3 {

        if (v.x !== 0)
            this.x /= v.x;

        if (v.y !== 0)
            this.y /= v.y;

        if (v.z !== 0)
            this.z /= v.z;

        return this;
    }

    distTo (v: v3): number {
        return this.clone.sub(v).magnitude;
    }

    diff (v: v3) {
        return new v3(
            Math.abs(this.x - v.x),
            Math.abs(this.y - v.y),
            Math.abs(this.z - v.z)
        );
    }

    get magnitude (): number {
        let dot = this.x**2 + this.y**2 + this.z**2;
        
        if (dot === 0) return 0;
        
        return Math.sqrt(dot);
    }

    normalise (): v3 {
        const m = this.magnitude;

        if (m !== 0)
            this.scale(1/m);
        else
            console.error(`Cannot normalise vector with magnitude 0`);

        return this;
    }

    get clone (): v3 {
        return new v3(this.x, this.y, this.z);
    }

    get str (): string {
        return `x: ${this.x} \ny: ${this.y} \nz: ${this.z}`;
    }

    equals (v: v3): boolean {
        return (
            v.x === this.x &&
            v.y === this.y &&
            v.z === this.z
        )
    }

    isInCuboid (rectPos: v3, rectDimensions: v3): boolean {
        /*
         Checks to see if the point is inside the top, right and front face of the cuboid,
         and if it is in all three then it is inside the cuboid
         */
        return (
            // front (x, y)
            (new v2(this.x, this.y)).isInRect(
                new v2(rectPos.x, rectPos.y),
                new v2(rectDimensions.x, rectDimensions.y)
            ) &&
            // right (y, z)
            (new v2(this.y, this.z)).isInRect(
                new v2(rectPos.y, rectPos.z),
                new v2(rectDimensions.y, rectDimensions.z)
            ) &&
            // top (x, z)
            (new v2(this.x, this.z)).isInRect(
                new v2(rectPos.x, rectPos.z),
                new v2(rectDimensions.x, rectDimensions.z)
            )
        );
    }

    set (to: v3): v3 {
        this.x = to.x;
        this.y = to.y;
        this.z = to.z;
        return this;
    }

    apply (m: (v: number) => number) {
        this.x = m(this.x);
        this.y = m(this.y);
        this.z = m(this.z);
    }

    dot (v: v3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    cross (v: v3): number {
        return this.x * v.y - this.y * v.x - this.z * v.z;
    }

    get negative (): v3 {
        return this.clone.scale(-1);
    }

    toInt (): v3 {
        this.apply(Math.round);
        return this;
    }
    
    get v2 (): v2 {
        return new v2(this.x, this.y);
    }

    get array (): number[] {
        return [this.x, this.y, this.z];
    }

    //      STATIC

    static get up () {
        return new v3(0, 1, 0);
    }
    static get down (){
        return new v3(0, -1, 0);
    }
    static get right (){
        return new v3(1, 0, 0);
    }
    static get left (){
        return new v3(-1, 0, 0);
    }
    static get forward (){
        return new v3(0, 0, 1);
    }
    static get back (){
        return new v3(0, 0, -1);
    }

    static get zero (){
        return new v3(0, 0, 0);
    }

    static avPoint(points: v3[]) {
        let total = v3.zero;

        for (let point of points)
            total.add(point);

        return total.scale(1/points.length);
    }
    
    static fromArray (arr: any) {
        return new v3(arr[0], arr[1], arr[2]);
    }
}

export class TriangleV3 {

    points: [v3, v3, v3];

    constructor (p1: v3, p2: v3, p3: v3) {
        this.points = [p1, p2, p3];
    }

    move (by: v3) {
        for (const point of this.points) {
            point.add(by);
        }
    }

    apply (cb: (point: v3) => v3) {
        for (let i = 0; i < 3; i++) {
            this.points[i] = cb(this.points[i].clone);
        }
    }

    get clone () {
        return new TriangleV3(
            this.points[0].clone,
            this.points[1].clone,
            this.points[2].clone
        );
    }

    get triangleV2 () {
        return new TriangleV2([
            this.points[0].v2,
            this.points[1].v2,
            this.points[2].v2
        ]);
    }

    get json () {
        let points = [];
        for (const p of this.points) {
            points.push(p.array);
        }
        return points;
    }
}
export type PointArr = [number, number, number, number?];
export type TriangleArr = [PointArr, PointArr, PointArr]
export type MeshArr = TriangleArr[];

export class MeshV3 {

    triangles: TriangleV3[];

    constructor (Triangles: TriangleV3[]) {
        this.triangles = Triangles;
    }

    move (by: v3) {
        for (const tri of this.triangles) {
            tri.move(by);
        }
    }

    get json (): any {
        let tris = [];
        for (const tri of this.triangles) {
            tris.push(tri.json);
        }
        return tris;
    }

    //      STATIC
    static fromArray (arr: MeshArr) {
        let mesh = new MeshV3([]);

        // parse array of triangles into mesh
        for (let tri of arr) {
            const points = [];
            for (let point of tri) {
                points.push(v3.fromArray(point));
            }

            // @ts-ignore - wrong number of arguments for TriangleV3 constructor - assumed to be safe
            mesh.triangles.push(new TriangleV3(...points));
        }

        return mesh;
    }

    // basic shapes

    static get cube (): MeshV3 {
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