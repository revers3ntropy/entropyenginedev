import {Context} from "./context.js";
import {input} from "../../input.js";

export const digits = '0123456789';
export const identifierChars = '_$@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';

export const global = new Context();

export class Undefined {}
export const None = new Undefined();

export const stringSurrounds = ['\'', '`', '"'];

export const KEYWORDS = [

    'var',
    'global',
    'let',
    'const',

    'if',
    'else',

    'while',
    'for',
    'in',
    'continue',
    'break',

    'func',
    'return',
    'yield',

    'class',
    'extends',
    'script'
];

export const globalConstants: {[name: string]: any} = {
    'false': false,
    'true': true,
    'null': 0,
    'undefined': None,
    'maths': {
        ...Math,
        mod: (x: number, y: number) => x % y
    },
    'input': input,
    'keyCode': input,
    'timer': {
        __startTime__: 0,

        start: () => {
            globalConstants.timer.__startTime__ = performance.now();
        },
        reset: () => {
            globalConstants.timer.__startTime__ = performance.now();
        },
        log: () => {
            console.log(`${globalConstants.timer.get()}ms`);
        },
        stop: () => {
            globalConstants.timer.__startTime__ = 0;
        },
        get: () => {
            let ms = performance.now() - globalConstants.timer.__startTime__;
            // @ts-ignore - ms of time number not string
            return Number(ms.toPrecision(2));
        }
    }
}
