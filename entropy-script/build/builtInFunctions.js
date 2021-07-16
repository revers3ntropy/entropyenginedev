var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Context } from "./context.js";
import { str } from "./util.js";
import * as n from './nodes.js';
import { Undefined } from "./constants.js";
import { TypeError } from "./errors.js";
import { Position } from "./position.js";
export const builtInFunctions = {
    'range': (context) => __awaiter(void 0, void 0, void 0, function* () {
        let start = context.get('start');
        let stop = context.get('stop');
        let step = context.get('step') || 1;
        if (step instanceof Undefined)
            step = undefined;
        if (stop instanceof Undefined)
            stop = undefined;
        if (start instanceof Undefined)
            start = undefined;
        for (let number of [start, stop, step]) {
            if (!['undefined', 'number'].includes(typeof number))
                return new TypeError(Position.unknown, Position.unknown, 'undefined | number', typeof number, number, 'running built in function "range"');
        }
        const res = [];
        if (!stop && stop !== 0) {
            for (let i = 0; i < start; i++) {
                res.push(i);
            }
            return res;
        }
        if (start > stop)
            return res;
        for (let i = start; i < stop; i += step) {
            res.push(i);
        }
        console.log(res);
        return res;
    }),
    'log': (context) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        let msg = (_a = context.get('message')) !== null && _a !== void 0 ? _a : '';
        msg = yield runBuiltIn('str', [msg]);
        console.log(msg);
        return context.get('message');
    }),
    'str': (context) => __awaiter(void 0, void 0, void 0, function* () {
        let val = context.get('val');
        return str(val);
    }),
    'type': (context) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
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
                return (_b = val.constructor.name) !== null && _b !== void 0 ? _b : 'object';
            default:
                return typeof val;
        }
    })
};
export const builtInArgs = {
    'add': ['a', 'b'],
    'range': ['start', 'stop', 'step'],
    'log': ['message'],
    'str': ['val'],
    'type': ['val'],
};
export function runBuiltIn(name, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const tempCtx = new Context();
        let i = 0;
        for (let arg of builtInArgs[name]) {
            tempCtx.set(arg, args[i]);
            i++;
        }
        return yield builtInFunctions[name](tempCtx);
    });
}
