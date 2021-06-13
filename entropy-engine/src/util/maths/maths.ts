import { v2, MeshV2, TriangleV2 } from './maths2D.js';
import { v3, MeshV3, TriangleV3 } from './maths3D.js';

export { v2, MeshV2, TriangleV2, v3, MeshV3, TriangleV3 };

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