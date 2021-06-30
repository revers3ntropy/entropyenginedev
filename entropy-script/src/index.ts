import {Lexer} from "./lexer.js";
import {Parser} from "./parser.js";

export function run (msg: string) {
    const lexer = new Lexer(msg);
    const [tokens, error] = lexer.generate();
    if (error)
        return error.str;

    const parser = new Parser(tokens);
    const res = parser.parse();
    if (res.error)
        return res.error.str;

    return res.node?.interpret({});
}

export function interpret (text: string) {

}