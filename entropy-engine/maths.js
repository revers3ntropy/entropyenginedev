export class v2 {
    constructor(x, y) {
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
        return new v2(Math.abs(this.x - v.x), Math.abs(this.y = v.y));
    }
    get magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) +
            Math.pow(this.y, 2));
    }
    normalise() {
        const m = this.magnitude;
        if (m !== 0)
            this.scale(1 / m);
        return this;
    }
    get clone() {
        return new v2(this.x, this.y);
    }
    get angle() {
        return Math.atan2(this.y, this.x);
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
export class Triangle {
    constructor(points) {
        this.points = points;
    }
    move(by) {
        for (const point of this.points) {
            point.add(by);
        }
    }
}
export class Mesh {
    constructor(Triangles) {
        this.triangles = Triangles;
    }
    move(by) {
        for (const tri of this.triangles) {
            tri.move(by);
        }
    }
}
export function polygonCollidingWithPoint(polygonPoints, point) {
    if (polygonPoints.length <= 1)
        return false;
    let lines = [
        [polygonPoints[0], polygonPoints[polygonPoints.length - 1]],
        [polygonPoints[0], polygonPoints[1]]
    ];
    // skip last and first points and do wrapping around separately
    for (let i = 1; i < polygonPoints.length - 1; i++)
        lines.push([polygonPoints[i], polygonPoints[i + 1]]);
    let intersections = 0;
    for (let line of lines) {
        // if they are both above or both below, then it cannot intersect
        if (line[0].y > point.y && line[1].y > point.y)
            continue;
        if (line[0].y < point.y && line[1].y < point.y)
            continue;
        let belowPoint = line[0].y < point.y ? line[0] : line[1];
        let abovePoint = line[0].y > point.y ? line[0] : line[1];
        if (Object.is(belowPoint, abovePoint))
            continue;
        const xPos = belowPoint.x + (((point.y - belowPoint.y) * (abovePoint.x - belowPoint.x)) / (abovePoint.y - belowPoint.y));
        if (xPos < point.x)
            continue;
        intersections++;
    }
    return intersections % 2 === 1;
}
