export class Matrix {
    constructor(n, m, _ = 0) {
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
    at(x, y) {
        return this.m[y][x];
    }
    set(x, y, to) {
        this.m[y][x] = to;
    }
    static projection(camera, aspectRatio) {
        const fovRad = 1 / Math.tan(camera.fov * 0.5 / 180 * 3.14159);
        const m = new Mat4();
        m.m[0][0] = aspectRatio * fovRad;
        m.m[1][1] = fovRad;
        m.m[2][2] = camera.far / (camera.far - camera.near);
        m.m[3][2] = (-camera.far * camera.near) / (camera.far - camera.near);
        m.m[2][3] = 1;
        m.m[3][3] = 0;
        return m;
    }
    static rotationX(theta) {
        let m = new Mat4();
        m.m[0][0] = 1;
        m.m[1][1] = Math.cos(theta * 0.5);
        m.m[1][2] = Math.sin(theta * 0.5);
        m.m[2][1] = -Math.sin(theta * 0.5);
        m.m[2][2] = Math.cos(theta * 0.5);
        m.m[3][3] = 1;
        return m;
    }
    static rotationY(theta) {
        let m = new Mat4();
        m.m[0][0] = Math.cos(theta);
        m.m[0][1] = Math.sin(theta);
        m.m[1][0] = -Math.sin(theta);
        m.m[1][1] = Math.cos(theta);
        m.m[2][2] = 1;
        m.m[3][3] = 1;
        return m;
    }
    static rotation(pitch, yaw, roll) {
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
            [cosA * cosB, cosA * cosB * sinC - sinA * cosC, cosA * sinB * cosC + sinA * sinC, 0],
            [sinA * cosB, sinA * sinB * sinC + cosA * cosC, sinA * sinB * cosC - cosA * sinC, 0],
            [-sinB, cosB * sinC, cosB * cosC, 0],
            [0, 0, 0, 1]
        ];
        return matrix;
    }
}
export class Mat4 extends Matrix {
    constructor(fill = 0) {
        super(4, 4, fill);
    }
}
