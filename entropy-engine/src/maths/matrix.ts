import {v3} from "./v3.js";

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
}

export class Mat4 extends Matrix {
    constructor(fill = 0) {
        super(4, 4, fill);
    }

    timesMat (mat: Mat4): Mat4 {
        // Slice the second matrix up into rows
        let row0 = new v3(mat.at(0, 0), mat.at(1, 0), mat.at(2, 0), mat.at(3, 0));
        let row1 = new v3(mat.at(0, 1), mat.at(1, 1), mat.at(2, 1), mat.at(3, 1));
        let row2 = new v3(mat.at(0, 2), mat.at(1, 2), mat.at(2, 0), mat.at(3, 2));
        let row3 = new v3(mat.at(0, 3), mat.at(1, 3), mat.at(2, 0), mat.at(3, 3));


        // Multiply each row by matrixA
        let result0 = this.transformV3(row0);
        let result1 = this.transformV3(row1);
        let result2 = this.transformV3(row2);
        let result3 = this.transformV3(row3);

        // Turn the result rows back into a single matrix
        const result = new Mat4();
        result.m = [
            [result0.x, result0.y, result0.z, result0.w],
            [result1.x, result1.y, result1.z, result1.w],
            [result2.x, result2.y, result2.z, result2.w],
            [result3.x, result3.y, result3.z, result3.w]
        ];
        return result;
    }

    transformV3 (v: v3) {
        return new v3(
            v.x * this.at(0,0) + v.y * this.at(0, 1) + v.z * this.at(2,0) + this.at(0, 3),
            v.x * this.at(1, 0) + v.y * this.at(1,1) + v.z * this.at(1, 2) + this.at(1, 3),
            v.x * this.at(2, 0) + v.y * this.at(2, 1) + v.z * this.at(2,2) + this.at(2, 3)
        );
    }

    static unit () {
        const m = new Mat4(0);
        for (let i = 0; i < 4; i++) {
            m.m[i][i] = 1;
        }
        return m;
    }
}