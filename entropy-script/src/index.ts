import {Lexer} from "./lexer.js";
import {Parser} from "./parser.js";
import {global} from "./constants.js";
import {initialise} from "./init.js";
import {ESError} from "./errors.js";
import {Position} from "./position.js";
import {interpretResult} from "./nodes.js";

export function init (printFunc: (...args: any) => void = console.log) {
    initialise(global, printFunc);
}

export async function run (msg: string, env = global): Promise<interpretResult> {

    if (!env.root.initialisedAsGlobal){
        const res = new interpretResult();
        res.error = new ESError(
            Position.unknown,
            Position.unknown,
            'Uninitialised',
            'Global context has not been initialised with global values'
        );
        return res;
    }

    const lexer = new Lexer(msg);
    const [tokens, error] = lexer.generate();
    if (error) {
        const res_ = new interpretResult();
        res_.error = error;
        return res_;
    }

    const parser = new Parser(tokens);
    const res = parser.parse();
    if (res.error) {
        const res_ = new interpretResult();
        res_.error = res.error;
        return res_;
    }

    if (!res.node) {
        const res = new interpretResult();
        res.val = [];
        return res;
    }


    return await res.node.interpret(env);
}