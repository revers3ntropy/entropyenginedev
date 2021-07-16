import {Context} from "./context.js";
import {str} from "./util.js";
import * as n from './nodes.js';
import {Undefined} from "./constants.js";

export const builtInFunctions: {[name: string]: (context: Context) => Promise<any>} = {
    'range': async context => {
        let start = context.get('start');
        let stop = context.get('stop');
        const step = context.get('step') || 1;

        const res: number[] = [];

        if (!stop && stop !== 0) {
            for (let i = 0; i < start; i++) {
                res.push(i);
            }
            return res;
        }

        if (start > stop) return res;

        for (let i = start; i < stop; i += step) {
            res.push(i);
        }

        return res;
    },

    'log': async context => {
        let msg = context.get('message') ?? '';
        msg = await runBuiltIn('str', [msg]);
        console.log(msg);
        return context.get('message');
    },

    'str': async context => {
        let val = context.get('val');
        return str(val);
    },

    'type': async context => {
        let val = context.get('val');
        switch (typeof val) {
            case "function":
                return 'function';
            case "boolean":
                return 'bool';
            case "number":
                return 'number';
            case "string":
                return 'string';
            case "undefined":
                return 'undefined';
            case "object":
                if (val instanceof n.N_function)
                    return 'function';
                else if (val instanceof n.N_class)
                    return 'type';
                else if (val instanceof Undefined)
                    return 'undefined';
                else if (Array.isArray(val))
                    return 'array';

                return val.constructor.name ?? 'object';

            default:
                return typeof val;
        }
    }
}

export const builtInArgs: {[name: string]: string[]} = {
    'add': ['a', 'b'],
    'range': ['start', 'stop', 'step'],
    'log': ['message'],
    'str': ['val'],
    'type': ['val'],
}

export async function runBuiltIn (name: string, args: any[]): Promise<any> {
    const tempCtx = new Context();
    let i = 0;
    for (let arg of builtInArgs[name]) {
        tempCtx.set(arg, args[i]);
        i++;
    }
    return await builtInFunctions[name](tempCtx);
}