import {v2, v3} from "../maths/maths.js";

export function sleep(ms: number) {
    // @ts-ignore
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getCanvasSize (canvas: HTMLCanvasElement): v2 {
    return new v2(canvas.width, canvas.height);
}

export function getZoomScaledPosition (pos: v2, zoom: number, center: v2): v2 {
    // scales the position from the center
    return pos.sub(center).scale(zoom).add(center);
}

export function getCanvasStuff(id: string) {
    const c = <HTMLCanvasElement> document.getElementById(id);
    return {
        canvas: c,
        ctx: <CanvasRenderingContext2D> c.getContext('2d')
    }
}

export function setCanvasSize (canvas: HTMLCanvasElement) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
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

export function JSONifyComponent (component: any, type? : string) {
    let json: any = {};

    for (const property in component) {
        // public as they are set with getters and setters on the individual components
        // type stuff as that is dealt with separately
        if (['type', 'subtype', 'hasSubType', 'public'].indexOf(property) !== -1) continue;

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

export function scaleMeshV2 (mesh: v2[], factor: v2) {
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

export function nameFromScriptURL (path: string): string {
    // ../projects/12345/assets/folder/script.es for example
    let file = path.substring(path.lastIndexOf('/') + 1);
    return file.substring(0, file.length-3);
}

export function genCacheBust (): number {
    return Math.ceil(Math.random() * 10000);
}