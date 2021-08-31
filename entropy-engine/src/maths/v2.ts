/**
 * @module entropy-engine/maths/v2
 */
import {v3} from "./v3.js";

/**
 * @description 2 dimensional Vector constructor
 * @class module:entropy-engine/maths/v2.v2
 * @param {number} x
 * @param {number} [y=x]
 * @example
 * Entropy Script:
 * const v = v2(n, m);
 *
 * Javascript:
 * const v = new v2(n, m);
 */
export class v2 {
    x: number;
    y: number;

    constructor(x: number, y: number = x) {
        this.x = x;
        this.y = y;
    }

    /**
     * Adds a vector to this vector. Does not effect the passed vector.
     * @param {v2} v
     * @returns {v2} this vector
     */
    add (v: v2): v2 {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /**
     * Subtracts a vector from this vector. Does not effect the passed vector.
     * @param {v2} v
     * @returns {v2} this vector
     */
    sub (v: v2): v2 {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /**
     * Multiplies each component of passed vector by component of this vector. Does not effect the passed vector.
     * @param {v2} v
     * @returns {v2} this vector
     */
    mul (v: v2): v2 {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }

    /**
     * Multiplies x and y of this vector by a number
     * @param {number} factor
     * @returns {v2} this vector
     */
    scale (factor: number): v2 {
        this.x *= factor;
        this.y *= factor;
        return this;
    }

    /**
     * Divides this vector by the passed vector.
     * @param {v2} v - vector to divide by
     * @returns {v2} this vector
     */
    div (v: v2): v2 {

        if (v.x !== 0)
            this.x /= v.x;

        if (v.y !== 0)
            this.y /= v.y;

        return this;
    }

    /**
     * Returns the distance between two vectors as if they were points on a plain.
     * @param {v2} v
     * @returns {number}
     */
    distTo (v: v2): number {
        return Math.sqrt(
            (this.x - v.x) ** 2 +
            (this.y - v.y) ** 2
        );
    }

    /**
     * Generates a new vector which is the absolute difference between this vector and the passed one.
     * @param {v2} v
     * @returns {v2}
     */
    diff (v: v2) {
        return new v2(
            Math.abs(this.x - v.x),
            Math.abs(this.y - v.y)
        );
    }

    /**
     * The magnitude of this vector, calculated using Pythagoras' Theorem
     * @returns {number}
     */
    get magnitude (): number {
        return Math.sqrt(
            this.x ** 2 +
            this.y ** 2
        );
    }

    /**
     * Normalises this vector so that it has a magnitude of 1, but points in the same direction
     * @returns {v2} this vector
     */
    normalise (): v2 {
        const m = this.magnitude;

        if (m !== 0)
            this.scale(1/m);
        else
            console.error(`Cannot normalise vector with magnitude 0`);

        return this;
    }

    /**
     * Clone of this vector.
     * @returns {v2} new vector
     */
    get clone (): v2 {
        return new v2(this.x, this.y);
    }

    /**
     * The angle that this vector is pointing in
     * @returns {number}
     */
    get angle (): number {
        return -Math.atan2(-this.y, this.x);
    }

    /**
     * This vector in a human-readable form
     * @returns {string}
     */
    get str (): string {
        return `x: ${this.x} \ny: ${this.y}`;
    }

    /**
     * Returns if the components of this vector and another vector are the same (uses ===)
     * @param {v2} v vector to compare against
     * @returns {boolean}
     */
    equals (v: v2): boolean {
        return (
            v.x === this.x &&
            v.y === this.y
        )
    }

    /**
     * Returns true if this vector is inside a rectangle if it were a point on a plain
     * @param {v2} rectPos the position of the upper right corner of the rectangle
     * @param {v2} rectDimensions the size of the rectangle
     */
    isInRect (rectPos: v2, rectDimensions: v2): boolean {
        return (
            this.x > rectPos.x &&
            this.x < rectPos.x + rectDimensions.x &&
            this.y > rectPos.y &&
            this.y < rectPos.y + rectDimensions.y
        );
    }

    /**
     * Sets the x and y components of this vector to the same as a different vector.
     * @param {v2} to
     */
    set (to: v2): v2 {
        this.x = Number(to.x);
        this.y = Number(to.y);
        return this;
    }

    /**
     * Applies a function to the x and y parts of this vector.
     * Function in form (v: number) => number
     * @param {function} m
     */
    apply (m: (v: number) => number) {
        this.x = Number(m(this.x));
        this.y = Number(m(this.y));
    }

    /**
     * Gets the dot product of this vector and another
     * @returns {number}
     * @param v
     */
    dot (v: v2): number {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Gets the cross product of this vector and another
     * @retuns {number}
     * @param v
     */
    cross (v: v2): number {
        return this.x * v.y - this.y * v.x;
    }

    /**
     * Returns a clone of this vector scaled by -1
     */
    get negative (): v2 {
        return this.clone.scale(-1);
    }

    /**
     * Applies Math.round to this vector
     * @returns {v2} this vector
     */
    toInt (): v2 {
        this.apply(Math.round);
        return this;
    }

    /**
     * Returns this vector as a vector 3, where z=0
     * @returns {v3}
     */
    get v3 (): v3 {
        return new v3(this.x, this.y, 0);
    }

    /**
     * Returns this vector as an array where index 0 is the x component and index 1 is the y
     * @returns {number[]}
     */
    get array (): number[] {
        return [this.x, this.y];
    }

    /**
     * Gets a vector from the angle and magnitude.
     * @param {number} theta Angle of the vector in radians. Gets clamped to between 0 and 360.
     * @param {number} m The length of the vector
     * @returns {v2}
     */
    static fromAngleMagnitude (theta: number, m: number): v2 {
        while (theta < 0) theta += 360;
        theta %= 360;

        return new v2 (
            Math.sin(theta),
            Math.cos(theta)
        )
            .normalise()
            .scale(m);
    }

    /**
     * Converts an array into a vector
     * @static
     * @param {number[]} arr
     * @returns {v2}
     */
    static fromArray (arr: any) {
        return new v2(arr[0], arr[1]);
    }

    /**
     * @returns {v2} A vector pointing 'up' (x = 0, y = 1)
     */
    static get up () {
        return new v2(0, 1);
    }
    /**
     * @returns {v2} A vector pointing 'down' (x = 0, y = -1)
     */
    static get down (){
        return new v2(0, -1);
    }
    /**
     * @returns {v2} A vector pointing 'right' (x = 1, y = 0)
     */
    static get right (){
        return new v2(1, 0);
    }
    /**
     * @returns {v2} A vector pointing 'left' (x = -1, y = 0)
     */
    static get left (){
        return new v2(-1, 0);
    }

    /**
     * @returns {v2}A zeroed vector
     */
    static get zero (){
        return new v2(0, 0);
    }

    /**
     * Averages an array of vectors
     * @param {v2[]} points
     * @returns {v2}
     */
    static avPoint(points: v2[]) {
        let total = v2.zero;

        for (let point of points)
            total.add(point);

        return total.scale(1/points.length);
    }
}