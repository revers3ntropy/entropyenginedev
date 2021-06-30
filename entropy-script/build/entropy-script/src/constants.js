export const digits = '0123456789';
export var tokenType;
(function (tokenType) {
    tokenType[tokenType["NUMBER"] = 0] = "NUMBER";
    tokenType[tokenType["ADD"] = 1] = "ADD";
    tokenType[tokenType["SUB"] = 2] = "SUB";
    tokenType[tokenType["MUL"] = 3] = "MUL";
    tokenType[tokenType["DIV"] = 4] = "DIV";
    tokenType[tokenType["LPAREN"] = 5] = "LPAREN";
    tokenType[tokenType["RPAREN"] = 6] = "RPAREN";
    tokenType[tokenType["EOF"] = 7] = "EOF";
})(tokenType || (tokenType = {}));
export const tokenTypeString = {
    [tokenType.NUMBER]: 'Number',
    [tokenType.ADD]: '+',
    [tokenType.SUB]: '-',
    [tokenType.MUL]: '*',
    [tokenType.DIV]: '/',
    [tokenType.LPAREN]: '(',
    [tokenType.RPAREN]: ')',
    [tokenType.EOF]: 'End of File',
};
export const notFoundVariable = undefined;
