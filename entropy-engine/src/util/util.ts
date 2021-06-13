import {v2, v3} from "./maths/maths.js";
import {Component} from "../ECS/component.js";
import { Camera } from "../ECS/components/camera.js";
import { Sprite } from "../ECS/sprite.js";
import { Script } from "../index.js";

export function sleep(ms: number) {
    // @ts-ignore
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getCanvasSize (canvas: HTMLCanvasElement): v2 {
    const bounds = canvas.getBoundingClientRect();

    return new v2(canvas.width, canvas.height);
}

export function getZoomScaledPosition (pos: v2, zoom: number, center: v2): v2 {
    // scales the position from the center
    return pos.sub(center).scale(zoom).add(center);
}

export function screenSpaceToWorldSpace (point: v2, camera: Sprite, canvas: HTMLCanvasElement) {
    point = point.clone;
    const center = getCanvasSize(canvas).scale(0.5);

    point.set(getZoomScaledPosition(point, 1/camera.getComponent<Camera>('Camera').zoom, center));
    point.add(camera.transform.position.v2);
    point.sub(center);

    return point;
}

export function worldSpaceToScreenSpace (point: v2, camera: Sprite, canvas: HTMLCanvasElement) {
    const canvasSize = getCanvasSize(canvas);
    const mid = canvasSize.clone.scale(0.5);

    const cameraPos = camera.transform.position.clone
        .sub(mid.v3);

    const renderPos = point.clone.sub(cameraPos.v2);
    
    return getZoomScaledPosition(renderPos, camera.getComponent<Camera>('Camera').zoom, mid);
}

export function getCanvasStuff(id: string) {
    const c = <HTMLCanvasElement> document.getElementById(id);
    return {
        canvas: c,
        ctx: <CanvasRenderingContext2D> c.getContext('2d')
    }
}

export function deepClone(obj: any, hash = new WeakMap()): any {
    // Do not try to clone primitives or functions
    if (Object(obj) !== obj || obj instanceof Function) return obj;
    if (hash.has(obj)) return hash.get(obj); // Cyclic reference
    try { // Try to run constructor (without arguments, as we don't know them)
        var result = new obj.constructor();
    } catch(e) { // Constructor failed, create object without running the constructor
        result = Object.create(Object.getPrototypeOf(obj));
    }
    // Optional: support for some standard constructors (extend as desired)
    if (obj instanceof Map)
        Array.from(obj, ([key, val]) => result.set(deepClone(key, hash),
            deepClone(val, hash)) );
    else if (obj instanceof Set)
        Array.from(obj, (key) => result.add(deepClone(key, hash)) );
    // Register in hash
    hash.set(obj, result);
    // Clone and assign enumerable own properties recursively
    return Object.assign(result, ...Object.keys(obj).map (
        key => ({ [key]: deepClone(obj[key], hash) }) ));
}

export const expandV2 = (v: v2) => [v.x, v.y];
export const expandV3 = (v: v3) => [v.x, v.y, v.z];

export function JSONifyComponent (component: any, type? : string) {
    let json: any = {};

    for (const property in component) {
        // public as they are set with getters and setters on the indevidual components
        // type stuff as that is dealt with seperately
        if (['type', 'subtype', 'hasSubType', 'public'].indexOf(property) !== -1) continue;

        let value = component[property];

        if (value instanceof v2)
            value = [value.x, value.y];

        json[property] = value;
    }


    json.type = type || component.subtype;
    return json;
}

export function scaleMesh (mesh: v2[], factor: v2) {
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

export function loopThroughScripts (handler: (script: Script, sprite: Sprite) => void) {
    Sprite.loop(sprite => {
        for (const script of sprite.getComponents('Script'))
            handler(script as Script, sprite as Sprite);
    });
}

export function cullString (str: string, cutoff: number) {
    if (cutoff >= str.length)
        return str;

    let newStr = '';
    for (let i = 0; i < cutoff; i++)
        newStr += str[i] || '';

    if (newStr.length < str.length)
        newStr += '...';

    return newStr;
}