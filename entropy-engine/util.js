import { v2 } from "./maths.js";
export function sleep(ms) {
    // @ts-ignore
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function getCanvasSize(canvas) {
    const bounds = canvas.getBoundingClientRect();
    return new v2(canvas.width, canvas.height);
}
export function getZoomScaledPosition(pos, zoom, center) {
    // scales the position from the center
    return pos.sub(center).scale(zoom).add(center);
}
export function screenSpaceToWorldSpace(point, camera, canvas) {
    point = point.clone;
    const center = getCanvasSize(canvas).scale(0.5);
    point.set(getZoomScaledPosition(point, 1 / camera.getComponent('Camera').zoom, center));
    point.add(camera.transform.position);
    point.sub(center);
    return point;
}
export function worldSpaceToScreenSpace(point, camera, canvas) {
    const canvasSize = getCanvasSize(canvas);
    const mid = canvasSize.clone.scale(0.5);
    const cameraPos = camera.transform.position.clone
        .sub(canvasSize
        .clone
        .scale(0.5));
    const renderPos = point.clone.sub(cameraPos);
    return getZoomScaledPosition(renderPos, camera.getComponent('Camera').zoom, mid);
}
export function getCanvasStuff(id) {
    const c = document.getElementById(id);
    return {
        canvas: c,
        ctx: c.getContext('2d')
    };
}
export function deepClone(obj, hash = new WeakMap()) {
    // Do not try to clone primitives or functions
    if (Object(obj) !== obj || obj instanceof Function)
        return obj;
    if (hash.has(obj))
        return hash.get(obj); // Cyclic reference
    try { // Try to run constructor (without arguments, as we don't know them)
        var result = new obj.constructor();
    }
    catch (e) { // Constructor failed, create object without running the constructor
        result = Object.create(Object.getPrototypeOf(obj));
    }
    // Optional: support for some standard constructors (extend as desired)
    if (obj instanceof Map)
        Array.from(obj, ([key, val]) => result.set(deepClone(key, hash), deepClone(val, hash)));
    else if (obj instanceof Set)
        Array.from(obj, (key) => result.add(deepClone(key, hash)));
    // Register in hash
    hash.set(obj, result);
    // Clone and assign enumerable own properties recursively
    return Object.assign(result, ...Object.keys(obj).map(key => ({ [key]: deepClone(obj[key], hash) })));
}
export const expandV2 = (v) => [v.x, v.y];
/** @file https://github.com/bscotch/node-util/blob/main/src/lib/strings.ts **/
/**
 * Concatenate the string fragments and interpolated values
 * to get a single string.
 */
function populateTemplate(strings, ...interps) {
    let string = '';
    for (let i = 0; i < strings.length; i++) {
        string += `${strings[i] || ''}${interps[i] || ''}`;
    }
    return string;
}
/**
 * Shift all lines left by the *smallest* indentation level,
 * and remove initial newline and all trailing spaces.
 */
export function undent(strings, ...interps) {
    let string = populateTemplate(strings, ...interps);
    // Remove initial and final newlines
    string = string
        .replace(/^[\r\n]+/, '')
        .replace(/\s+$/, '');
    const dents = string.match(/^([ \t])*/gm);
    if (!dents || dents.length == 0) {
        return string;
    }
    dents.sort((dent1, dent2) => dent1.length - dent2.length);
    const minDent = dents[0];
    if (!minDent) {
        // Then min indentation is 0, no change needed
        return string;
    }
    const dedented = string.replace(new RegExp(`^${minDent}`, 'gm'), '');
    return dedented;
}
/**
 * Remove linebreaks and extra spacing in a template string.
 */
export function o(strings, ...interps) {
    return populateTemplate(strings, ...interps)
        .replace(/^\s+/, '')
        .replace(/\s+$/, '')
        .replace(/\s+/g, ' ');
}
export function JSONifyComponent(component) {
    let json = {};
    for (const property in component) {
        if (['type', 'subtype', 'hasSubType'].indexOf(property) !== -1)
            continue;
        let value = component[property];
        if (value instanceof v2)
            value = [value.x, value.y];
        json[property] = value;
    }
    json.type = component.subtype;
    return json;
}
export function scaleMesh(mesh, factor) {
    const points = mesh.map(point => point.clone);
    let avPoint = v2.avPoint(points);
    // scaleBy around that point
    for (let point of points) {
        const pointToCenter = point.clone.sub(avPoint);
        // scaleBy by the factor
        pointToCenter.mul(factor);
        // get the points new location based off the scales vector from the center
        const finalLocation = avPoint.clone.add(pointToCenter);
        point.set(finalLocation);
    }
    return points;
}
