import { v2, v3 } from "./maths/maths.js";
import { Sprite } from "../ECS/sprite.js";
export function sleep(ms) {
    // @ts-ignore
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function getCanvasSize(canvas) {
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
    point.add(camera.transform.position.v2);
    point.sub(center);
    return point;
}
export function worldSpaceToScreenSpace(point, camera, canvas) {
    const canvasSize = getCanvasSize(canvas);
    const mid = canvasSize.clone.scale(0.5);
    const cameraPos = camera.transform.position.clone
        .sub(mid.v3);
    const renderPos = point.clone.sub(cameraPos.v2);
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
export function JSONifyComponent(component, type) {
    let json = {};
    for (const property in component) {
        // public as they are set with getters and setters on the individual components
        // type stuff as that is dealt with separately
        if (['type', 'subtype', 'hasSubType', 'public'].indexOf(property) !== -1)
            continue;
        let value = component[property];
        if (value instanceof v2 || value instanceof v3)
            value = value.array;
        else if (value.isColour) {
            value = value.json;
        }
        json[property] = value;
    }
    json.type = type || component.subtype;
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
export function loopThroughScripts(handler) {
    Sprite.loop(sprite => {
        for (const script of sprite.getComponents('Script'))
            handler(script, sprite);
    });
}
export function cullString(str, cutoff) {
    if (cutoff >= str.length)
        return str;
    let newStr = '';
    for (let i = 0; i < cutoff; i++)
        newStr += str[i] || '';
    if (newStr.length < str.length)
        newStr += '...';
    return newStr;
}
