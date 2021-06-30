import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
export function run(msg) {
    var _a;
    const lexer = new Lexer(msg);
    const [tokens, error] = lexer.generate();
    if (error)
        return error.str;
    const parser = new Parser(tokens);
    const res = parser.parse();
    if (res.error)
        return res.error.str;
    return (_a = res.node) === null || _a === void 0 ? void 0 : _a.interpret({});
}
export function interpret(text) {
}
