/**
 * @module entropy-engine/maths
 */
import {v2} from "./v2";

export * from './matrix.js';

export * from './v2.js';
export * from './v3.js';

export * from './meshV2.js';
export * from './meshV3.js';

export * from './triangleV2.js';
export * from './triangleV3.js';

/**
 * Calculates if the point is in a polygon described by moving through each point in the array passed in
 * @param {v2[]} polygonPoints
 * @param {v2} point
 */
export function polygonCollidingWithPoint (polygonPoints: v2[], point: v2): boolean {

    if (polygonPoints.length <= 1) return false;

    let lines = [
        [polygonPoints[0], polygonPoints[polygonPoints.length-1]],
        [polygonPoints[0], polygonPoints[1]]
    ];
    // skip last and first points and do wrapping around separately
    for (let i = 1; i < polygonPoints.length-1; i++)
        lines.push([polygonPoints[i], polygonPoints[i + 1]]);

    let intersections = 0;

    for (let line of lines) {

        // if they are both above or both below, then it cannot intersect
        if (line[0].y > point.y && line[1].y > point.y)  continue;
        if (line[0].y < point.y && line[1].y < point.y)  continue;

        let belowPoint = line[0].y < point.y ? line[0] : line[1];
        let abovePoint = line[0].y > point.y ? line[0] : line[1];

        if (Object.is(belowPoint, abovePoint)) continue;

        const xPos = belowPoint.x + (((point.y - belowPoint.y) * (abovePoint.x - belowPoint.x)) / (abovePoint.y - belowPoint.y));

        if (xPos < point.x) continue

        intersections++;
    }

    return intersections % 2 === 1;
}