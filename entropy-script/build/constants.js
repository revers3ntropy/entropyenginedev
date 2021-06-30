export const digits = '0123456789';
export const notFoundVariable = undefined;
export const identifierChars = '_$@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export var tokenType;
(function (tokenType) {
    tokenType[tokenType["NUMBER"] = 0] = "NUMBER";
    tokenType[tokenType["IDENTIFIER"] = 1] = "IDENTIFIER";
    tokenType[tokenType["KEYWORD"] = 2] = "KEYWORD";
    tokenType[tokenType["OBRACES"] = 3] = "OBRACES";
    tokenType[tokenType["CBRACES"] = 4] = "CBRACES";
    tokenType[tokenType["ASSIGN"] = 5] = "ASSIGN";
    tokenType[tokenType["ADD"] = 6] = "ADD";
    tokenType[tokenType["SUB"] = 7] = "SUB";
    tokenType[tokenType["MUL"] = 8] = "MUL";
    tokenType[tokenType["DIV"] = 9] = "DIV";
    tokenType[tokenType["POW"] = 10] = "POW";
    tokenType[tokenType["OPAREN"] = 11] = "OPAREN";
    tokenType[tokenType["CPAREN"] = 12] = "CPAREN";
    tokenType[tokenType["EQUALS"] = 13] = "EQUALS";
    tokenType[tokenType["NOTEQUALS"] = 14] = "NOTEQUALS";
    tokenType[tokenType["NOT"] = 15] = "NOT";
    tokenType[tokenType["GT"] = 16] = "GT";
    tokenType[tokenType["LT"] = 17] = "LT";
    tokenType[tokenType["GTE"] = 18] = "GTE";
    tokenType[tokenType["LTE"] = 19] = "LTE";
    tokenType[tokenType["AND"] = 20] = "AND";
    tokenType[tokenType["OR"] = 21] = "OR";
    tokenType[tokenType["EOF"] = 22] = "EOF";
})(tokenType || (tokenType = {}));
export let tt = tokenType;
export const tokenTypeString = {
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
    '}': tt.CBRACES
};
export const KEYWORDS = [
    'var',
    'global',
    'if',
    'else',
    'while',
];
