import * as n from './nodes.js';
import { InvalidSyntaxError } from "./errors.js";
import { tokenType, tokenTypeString } from "./constants.js";
export class ParseResults {
    constructor() { }
    register(res) {
        if (res instanceof ParseResults) {
            if (res.error)
                this.error = res.error;
            return res.node;
        }
        return res;
    }
    success(node) {
        this.node = node;
        return this;
    }
    failure(error) {
        this.error = error;
        return this;
    }
}
export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.tokenIdx = -1;
        this.currentToken = tokens[0];
        this.advance();
    }
    parse() {
        var _a, _b;
        const res = this.expr();
        if (!res.error && this.currentToken.type !== tokenType.EOF) {
            return res.failure(new InvalidSyntaxError((_a = this.currentToken) === null || _a === void 0 ? void 0 : _a.startPos, (_b = this.currentToken) === null || _b === void 0 ? void 0 : _b.endPos, `Expected 'End of File', got '${tokenTypeString[this.currentToken.type]}'`));
        }
        return res;
    }
    advance() {
        this.tokenIdx++;
        if (this.tokenIdx < this.tokens.length)
            this.currentToken = this.tokens[this.tokenIdx];
        return this.currentToken;
    }
    factor() {
        const res = new ParseResults();
        const tok = this.currentToken;
        switch (tok.type) {
            case tokenType.NUMBER:
                res.register(this.advance());
                return res.success(new n.N_number(tok));
            case tokenType.SUB:
            case tokenType.ADD:
                res.register(this.advance());
                const factor = res.register(this.factor());
                if (res.error)
                    return res;
                return res.success(new n.N_unaryOp(factor, tok));
            case tokenType.LPAREN:
                res.register(this.advance());
                const expr = res.register(this.expr());
                if (res.error)
                    return res;
                if (this.currentToken.type == tokenType.RPAREN) {
                    res.register(this.advance());
                    return res.success(expr);
                }
                return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected ')'"));
            default:
                return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, `Expected 'Number', 'Open Bracket' or 'Subtract'`));
        }
    }
    term() {
        return this.binOp(() => this.factor(), [tokenType.MUL, tokenType.DIV]);
    }
    expr() {
        return this.binOp(() => this.term(), [tokenType.ADD, tokenType.SUB]);
    }
    binOp(func, ops) {
        const res = new ParseResults();
        let left = res.register(func());
        if (res.error)
            return res;
        while (ops.indexOf(this.currentToken.type) !== -1) {
            const opTok = this.currentToken;
            res.register(this.advance());
            const right = res.register(func());
            if (res.error)
                return res;
            left = new n.N_binOp(left, opTok, right);
        }
        return res.success(left);
    }
}
