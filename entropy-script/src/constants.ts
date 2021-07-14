import {Context} from "./context.js";

export const digits = '0123456789';
export const identifierChars = '_$@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';

export const global = new Context();

export class Undefined {}

export enum tokenType {
    NUMBER,
    STRING,

    ENDSTATEMENT,

    IDENTIFIER,
    KEYWORD,

    COMMA,

    ASSIGN,

    ADD,
    SUB,
    MUL,
    DIV,
    POW,

    OPAREN,
    CPAREN,
    OBRACES,
    CBRACES,
    OSQUARE,
    CSQUARE,

    EQUALS,
    NOTEQUALS,
    NOT,
    GT,
    LT,
    GTE,
    LTE,
    AND,
    OR,

    COLON,
    DOT,

    EOF
}

export let tt = tokenType;

export type enumDict<T extends number, U> = { [K in T]: U };

export const tokenTypeString: enumDict<tokenType, string> = {
    [tt.NUMBER]: 'Number',
    [tt.STRING]: 'String',
    [tt.ENDSTATEMENT]: ';',

    [tt.IDENTIFIER]: 'Identifier',
    [tt.KEYWORD]: 'Keyword',

    [tt.COMMA]: ',',

    [tt.OBRACES]: '{',
    [tt.CBRACES]: '}',
    [tt.OPAREN]: '(',
    [tt.CPAREN]: ')',
    [tt.OSQUARE]: '[',
    [tt.CSQUARE]: ']',

    [tt.ASSIGN]: '=',

    [tt.ADD]: '+',
    [tt.SUB]: '-',
    [tt.MUL]: '*',
    [tt.DIV]: '/',
    [tt.POW]: '^',

    [tt.EQUALS]: '==',
    [tt.NOTEQUALS]: '!=',
    [tt.NOT]: '!',
    [tt.GT]: '>',
    [tt.LT]: '<',
    [tt.GTE]: '>=',
    [tt.LTE]: '<=',
    [tt.AND]: '&',
    [tt.OR]: '|',

    [tt.COLON]: ':',
    [tt.DOT]: '.',

    [tt.EOF]: 'End of File'
}

export const singleCharTokens: {[char: string]: tokenType} = {
    '*': tt.MUL,
    '/': tt.DIV,
    '+': tt.ADD,
    '-': tt.SUB,
    '(': tt.OPAREN,
    ')': tt.CPAREN,
    '^': tt.POW,
    '&': tt.AND,
    '|': tt.OR,
    '{': tt.OBRACES,
    '}': tt.CBRACES,
    ',': tt.COMMA,
    '[': tt.OSQUARE,
    ']': tt.CSQUARE,
    ';': tt.ENDSTATEMENT,
    ':': tt.COLON,
    '.': tt.DOT,
};

export const stringSurrounds = ['\'', '`', '"'];

export const KEYWORDS = [
    'var',
    'global',
    'if',
    'else',
    'while',
    'for',
    'in',
    'func',
    'return',
];

export const None = new Undefined();

export const globalConstants: {[name: string]: any} = {
    'false': false,
    'true': true,
    'null': 0,
    'undefined': None
}