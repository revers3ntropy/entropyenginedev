import { Context } from "./context.js";
export const digits = '0123456789';
export const identifierChars = '_$@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const singleLineComment = '//';
export const global = new Context();
export class Undefined {
}
export var tokenType;
(function (tokenType) {
    tokenType[tokenType["NUMBER"] = 0] = "NUMBER";
    tokenType[tokenType["STRING"] = 1] = "STRING";
    tokenType[tokenType["ENDSTATEMENT"] = 2] = "ENDSTATEMENT";
    tokenType[tokenType["IDENTIFIER"] = 3] = "IDENTIFIER";
    tokenType[tokenType["KEYWORD"] = 4] = "KEYWORD";
    tokenType[tokenType["COMMA"] = 5] = "COMMA";
    tokenType[tokenType["ASSIGN"] = 6] = "ASSIGN";
    tokenType[tokenType["ADD"] = 7] = "ADD";
    tokenType[tokenType["SUB"] = 8] = "SUB";
    tokenType[tokenType["MUL"] = 9] = "MUL";
    tokenType[tokenType["DIV"] = 10] = "DIV";
    tokenType[tokenType["POW"] = 11] = "POW";
    tokenType[tokenType["OPAREN"] = 12] = "OPAREN";
    tokenType[tokenType["CPAREN"] = 13] = "CPAREN";
    tokenType[tokenType["OBRACES"] = 14] = "OBRACES";
    tokenType[tokenType["CBRACES"] = 15] = "CBRACES";
    tokenType[tokenType["OSQUARE"] = 16] = "OSQUARE";
    tokenType[tokenType["CSQUARE"] = 17] = "CSQUARE";
    tokenType[tokenType["EQUALS"] = 18] = "EQUALS";
    tokenType[tokenType["NOTEQUALS"] = 19] = "NOTEQUALS";
    tokenType[tokenType["NOT"] = 20] = "NOT";
    tokenType[tokenType["GT"] = 21] = "GT";
    tokenType[tokenType["LT"] = 22] = "LT";
    tokenType[tokenType["GTE"] = 23] = "GTE";
    tokenType[tokenType["LTE"] = 24] = "LTE";
    tokenType[tokenType["AND"] = 25] = "AND";
    tokenType[tokenType["OR"] = 26] = "OR";
    tokenType[tokenType["EOF"] = 27] = "EOF";
})(tokenType || (tokenType = {}));
export let tt = tokenType;
export const tokenTypeString = {
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
    [tt.EOF]: 'End of File'
};
export const singleCharTokens = {
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
    ';': tt.ENDSTATEMENT
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
export const globalConstants = {
    'false': false,
    'true': true,
    'null': 0,
    'undefined': None
};
