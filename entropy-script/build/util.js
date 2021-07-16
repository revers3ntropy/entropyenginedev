import { Undefined } from "./constants.js";
import { Node } from "./nodes.js";
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
export function str(val, depth = 0) {
    if (depth > 20)
        return '...';
    let result = '';
    if (typeof val === 'undefined')
        return 'undefined';
    if (val instanceof Undefined) {
        return 'Undefined';
    }
    if (val instanceof Node) {
        return val.constructor.name;
    }
    if (typeof val === 'object') {
        result += val.constructor.name;
        result += ': ';
        if (Array.isArray(val)) {
            result += '[';
            for (let item of val) {
                result += `${str(item, depth + 1)}, `;
            }
            result = result.substring(0, result.length - 2);
            result += ']';
        }
        else {
            result += '{';
            for (let item in val) {
                if (val.hasOwnProperty(item) && !['this', 'this_', 'constructor', 'self'].includes(item))
                    result += `${item}: ${str(val[item], depth + 1)}, `;
            }
            result = result.substring(0, result.length - 2);
            result += '}';
        }
    }
    else if (typeof val === 'string' && depth !== 0) {
        result = `'${val}'`;
    }
    else {
        result = `${val}`;
    }
    return result;
}
