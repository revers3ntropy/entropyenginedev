import {Context} from "./context.js";
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
        const msg = context.get('message') || '';
        console.log(msg);
        return msg
    },

    'str': async context => {
        let val = context.get('val');
        let result = '';
        if (val instanceof Undefined) {
            return 'Undefined';
        }

        if (typeof val === 'object') {
            result += val.constructor.name;
            result += ': ';

            if (Array.isArray(val)) {
                result += '[';
                for (let item of val) {
                    result += `${await builtInFunctions.str(item)}, `;
                }
                result = result.substring(0, result.length - 2);
                result += ']';
            } else {
                result += '{';
                for (let item in val) {
                    if (val.hasOwnProperty(item))
                        result += `${item}: ${await builtInFunctions.str(val[item])}, `;
                }
                result = result.substring(0, result.length - 2);
                result += '}';
            }
        } else {
            result = `${val}`;
        }

        return result;
    }
}

export const builtInArgs: {[name: string]: string[]} = {
    'add': ['a', 'b'],
    'range': ['start', 'stop', 'step'],
    'log': ['message'],
    'str': ['val'],
}