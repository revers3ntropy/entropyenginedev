var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { global } from "./constants.js";
import { initialise } from "./init.js";
import { ESError } from "./errors.js";
import { Position } from "./position.js";
import { interpretResult } from "./nodes.js";
export function init(printFunc = console.log) {
    initialise(global, printFunc);
}
export function run(msg, env = global) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!env.root.initialisedAsGlobal) {
            const res = new interpretResult();
            res.error = new ESError(Position.unknown, Position.unknown, 'Uninitialised', 'Global context has not been initialised with global values');
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
        return yield res.node.interpret(env);
    });
}
