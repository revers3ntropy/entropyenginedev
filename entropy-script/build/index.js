import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { Context } from "./context.js";
const global = new Context();
export function run(msg) {
    const lexer = new Lexer(msg);
    const [tokens, error] = lexer.generate();
    if (error)
        return error.str;
    const parser = new Parser(tokens);
    const res = parser.parse();
    if (res.error)
        return res.error.str;
    if (!res.node)
        return '';
    return res.node.interpret(global);
}
