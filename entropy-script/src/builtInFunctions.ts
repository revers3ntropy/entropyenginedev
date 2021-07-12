import {Context} from "./context.js";

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
    }
}

export const builtInArgs: {[name: string]: string[]} = {
    'add': ['a', 'b'],
    'range': ['start', 'stop', 'step'],
    'log': ['message']
}