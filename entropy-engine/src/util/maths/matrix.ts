import {v3} from "./maths3D.js";

export class Matrix {
    m: number[][];

    constructor (n: number, m: number, _ = 0) {
        this.m = [];

        // initialise empty array
        for (let i = 0; i < m; i++) {

            const row = [];

            // populate array
            for (let j = 0; j < n; j++) {
                row.push(_);
            }

            this.m.push(row);
        }
    }

    public at (x: number, y: number) {
        return this.m[y][x];
    }

    public set (x: number, y: number, to: number) {
        this.m[y][x] = to;
    }

    transformV3 (v: v3) {
        return new v3(
            v.x * this.m[0][0] + v.y * this.m[1][0] + v.z * this.m[2][0] + this.m[3][0],
            v.x * this.m[0][1] + v.y * this.m[1][1] + v.z * this.m[2][1] + this.m[3][1],
            v.x * this.m[0][2] + v.y * this.m[1][2] + v.z * this.m[2][2] + this.m[3][2]
        );
    }

    static rotationX (theta: number) {
        let m = new Mat4();
        m.m[0][0] = 1;
        m.m[1][1] = Math.cos(theta * 0.5);
        m.m[1][2] = Math.sin(theta * 0.5);
        m.m[2][1] = -Math.sin(theta * 0.5);
        m.m[2][2] = Math.cos(theta * 0.5);
        m.m[3][3] = 1;
        return m;
    }

    static rotationY (theta: number) {
        let m = new Mat4();
		m.m[0][0] = Math.cos(theta);
        m.m[0][1] = Math.sin(theta);
        m.m[1][0] = -Math.sin(theta);
        m.m[1][1] = Math.cos(theta);
        m.m[2][2] = 1;
        m.m[3][3] = 1;
        return m;
    }

    static rotation (pitch: number, yaw: number, roll: number) {
        let matrix = new Mat4();

        let a = yaw;
        let b = pitch;
        let c = roll;

        let cosA = Math.cos(a);
        let cosB = Math.cos(b);
        let cosC = Math.cos(c);

        let sinA = Math.sin(a);
        let sinB = Math.sin(b);
        let sinC = Math.sin(c);

        // formulae source: http://planning.cs.uiuc.edu/node102.html
        matrix.m = [
            [ cosA * cosB,   cosA * cosB * sinC - sinA * cosC,   cosA * sinB * cosC + sinA * sinC,   0 ],
            [ sinA * cosB,   sinA * sinB * sinC + cosA * cosC,   sinA * sinB * cosC - cosA * sinC,   0 ],
            [ -sinB,         cosB * sinC,                        cosB * cosC,                        0 ],
            [ 0,              0,                                  0,                                 1 ]
        ];

        return matrix;
    }
}

export class Mat4 extends Matrix {
    constructor(fill = 0) {
        super(4, 4, fill);
    }
}