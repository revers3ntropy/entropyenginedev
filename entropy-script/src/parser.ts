import {Token} from "./tokens.js";
import * as n from './nodes.js';
import {ESError, InvalidSyntaxError} from "./errors.js";
import {tokenType, tokenTypeString} from "./constants.js";

export class ParseResults {
    node: n.Node | undefined;
    error: ESError | undefined
    constructor () {}

    register (res: ParseResults | any) {
        if (res instanceof ParseResults) {
            if (res.error) this.error = res.error;
            return res.node;
        }
        return res;
    }

    success (node: n.Node) {
        this.node = node;
        return this;
    }

    failure (error: ESError) {
        this.error = error;
        return this;
    }
}

export class Parser {
    tokens: Token[];
    currentToken: Token;
    tokenIdx: number;

    constructor (tokens: Token[]) {
        this.tokens = tokens;
        this.tokenIdx = -1;
        this.currentToken = tokens[0];
        this.advance();
    }

    public parse (): ParseResults {
        const res = this.expr();

        if (!res.error && this.currentToken.type !== tokenType.EOF) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken?.startPos,
                this.currentToken?.endPos,
                `Expected 'End of File', got '${tokenTypeString[this.currentToken.type]}'`
            ));
        }

        return res;
    }

    private advance () {
        this.tokenIdx++;
        if (this.tokenIdx < this.tokens.length)
            this.currentToken = this.tokens[this.tokenIdx];
        return this.currentToken;
    }

    private factor (): ParseResults {
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
                if (res.error) return res;
                return res.success(new n.N_unaryOp(factor, tok));

            case tokenType.LPAREN:
                res.register(this.advance());
                const expr = res.register(this.expr());
                if (res.error) return res;
                if (this.currentToken.type == tokenType.RPAREN) {
                    res.register(this.advance());
                    return res.success(expr);
                }
                return res.failure(new InvalidSyntaxError(
                   this.currentToken.startPos,
                   this.currentToken.endPos,
                   "Expected ')'"
                ));

            default:
                return res.failure(new InvalidSyntaxError(
                    this.currentToken.startPos,
                    this.currentToken.endPos,
                    `Expected 'Number', 'Open Bracket' or 'Subtract'`
                ));


        }
    }

    private term () {
        return this.binOp(() => this.factor(), [tokenType.MUL, tokenType.DIV])
    }

    private expr () {
        return this.binOp(() => this.term(), [tokenType.ADD, tokenType.SUB])
    }

    private binOp (func: () => ParseResults, ops: tokenType[]): ParseResults {
        const res = new ParseResults();
        let left = res.register(func());
        if (res.error) return res;

        while (ops.indexOf(this.currentToken.type) !== -1) {
            const opTok = this.currentToken;
            res.register(this.advance());
            const right = res.register(func());
            if (res.error) return res;
            left = new n.N_binOp(left, opTok, right);
        }

        return res.success(left);
    }
}