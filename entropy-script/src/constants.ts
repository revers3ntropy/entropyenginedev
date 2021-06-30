export const digits = '0123456789';
export const notFoundVariable = undefined;
export const identifierChars = '_$@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export enum tokenType {
    NUMBER,
    IDENTIFIER,
    KEYWORD,

    OBRACES,
    CBRACES,

    ASSIGN,

    ADD,
    SUB,
    MUL,
    DIV,
    POW,
    OPAREN,
    CPAREN,
    EQUALS,
    NOTEQUALS,
    NOT,
    GT,
    LT,
    GTE,
    LTE,
    AND,
    OR,

    EOF
}

export let tt = tokenType;

export type enumDict<T extends number, U> = { [K in T]: U };

export const tokenTypeString: enumDict<tokenType, string> = {
    [tt.NUMBER]: 'Number',
    [tt.IDENTIFIER]: 'Identifier',
    [tt.KEYWORD]: 'Keyword',

    [tt.OBRACES]: '{',
    [tt.CBRACES]: '}',

    [tt.ASSIGN]: '=',

    [tt.ADD]: '+',
    [tt.SUB]: '-',
    [tt.MUL]: '*',
    [tt.DIV]: '/',
    [tt.POW]: '^',
    [tt.OPAREN]: '(',
    [tt.CPAREN]: ')',
    [tt.EQUALS]: '==',
    [tt.NOTEQUALS]: '!=',
    [tt.NOT]: '!',
    [tt.GT]: '>',
    [tt.LT]: '<',
    [tt.GTE]: '>=',
    [tt.LTE]: '<=',
    [tt.AND]: '&',
    [tt.OR]: '|',

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
    '}': tt.CBRACES
};

export const KEYWORDS = [
    'var',
    'global',
    'if',
    'else',
    'while'
];