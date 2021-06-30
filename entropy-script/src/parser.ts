import {Token} from "./tokens.js";
import * as n from './nodes.js';
import {ESError, InvalidSyntaxError} from "./errors.js";
import {tokenType, tokenTypeString, tt} from "./constants.js";

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
        if (!this.currentToken || !this.tokens)
            return new ParseResults();

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

    private atom () {
        const res = new ParseResults();
        const tok = this.currentToken;

        switch (tok.type) {
            case tokenType.NUMBER:
                res.register(this.advance());
                return res.success(new n.N_number(tok));

            case tokenType.IDENTIFIER:
                res.register(this.advance());
                return res.success(new n.N_variable(tok));

            case tokenType.OPAREN:
                res.register(this.advance());
                const expr = res.register(this.expr());
                if (res.error) return res;
                if (this.currentToken.type == tokenType.CPAREN) {
                    res.register(this.advance());
                    return res.success(expr);
                }
                return res.failure(new InvalidSyntaxError(
                    this.currentToken.startPos,
                    this.currentToken.endPos,
                    "Expected ')'"
                ));

            case tt.KEYWORD:
                switch (tok.value) {
                    case 'if':
                        const expr = res.register(this.ifExpr());
                        if (res.error) return res;
                        return res.success(expr);

                    default:
                        return res.failure(new InvalidSyntaxError(
                            this.currentToken.startPos,
                            this.currentToken.endPos,
                            `Invalid Identifier ${tok.value}`
                        ));
                }

            default:
                return res.failure(new InvalidSyntaxError(
                    this.currentToken.startPos,
                    this.currentToken.endPos,
                    `Expected number, identifier, '(', '+' or '-'`
                ));
        }
    }

    private power () {
         return this.binOp(() => this.atom(), [tokenType.POW], () => this.factor());
    }

    private factor (): ParseResults {
        const res = new ParseResults();
        const tok = this.currentToken;

        switch (tok.type) {

            case tt.SUB:
            case tt.ADD:
                res.register(this.advance());
                const factor = res.register(this.factor());
                if (res.error) return res;
                return res.success(new n.N_unaryOp(factor, tok));

            default:
                return this.power();
        }
    }

    private term () {
        return this.binOp(() => this.factor(), [tt.MUL, tt.DIV]);
    }

    private arithmeticExpr () {
        return this.binOp(() => this.term(), [tt.ADD, tt.SUB]);
    }

    private comparisonExpr (): ParseResults {
        const res = new ParseResults();
        if (this.currentToken.type === tt.NOT) {
            const opTok = this.currentToken;
            res.register(this.advance());

            let node = res.register(this.comparisonExpr());
            if (res.error) return res;
            return res.success(new n.N_unaryOp(node, opTok));
        }

        let node = res.register(this.binOp(
            () => this.arithmeticExpr(),
            [tt.EQUALS, tt.NOTEQUALS, tt.GT, tt.GTE, tt.LTE, tt.LT]
        ));

        if (res.error) return res.failure(new InvalidSyntaxError(
            this.currentToken.startPos,
            this.currentToken.endPos,
            `Expected number, identifier, '(', '+', '!', or '-'`
        ));

        return res.success(node);
    }

    private expr (): ParseResults {
        const res = new ParseResults();

        if (this.currentToken.matches(tokenType.KEYWORD, 'var'))
            return this.assign(res, false);
        else if (this.currentToken.matches(tokenType.KEYWORD, 'global'))
            return this.assign(res, true);
        else if (this.currentToken.matches(tokenType.KEYWORD, 'if'))
            return this.ifExpr();
        else if (this.currentToken.matches(tokenType.KEYWORD, 'while'))
            return this.whileExpr();

        let node = res.register(this.binOp(() => this.comparisonExpr(), [tt.AND, tt.OR]));

        if (res.error) return res.failure(new InvalidSyntaxError(
            this.currentToken.startPos,
            this.currentToken.endPos,
            "Expected 'var', number, identifier, '+', '-' or '('"
        ));
        return res.success(node);
    }

    private binOp (func: () => ParseResults, ops: tokenType[] | [tokenType, string][], funcB=func): ParseResults {
        const res = new ParseResults();
        let left = res.register(func());
        if (res.error) return res;

        while (
            // @ts-ignore
            ops.indexOf(this.currentToken.type) !== -1
            // @ts-ignore
            || ops.indexOf([this.currentToken.type, this.currentToken.value]) !== -1
        ) {
            const opTok = this.currentToken;
            res.register(this.advance());
            const right = res.register(funcB());
            if (res.error) return res;
            left = new n.N_binOp(left, opTok, right);
        }

        return res.success(left);
    }

    private assign (res: ParseResults, isGlobal: boolean): ParseResults {
        res.register(this.advance());

        if (this.currentToken.type !== tokenType.IDENTIFIER) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                `Expected Identifier after keyword 'var'`
            ));
        }

        const varName = this.currentToken;
        res.register(this.advance());

        // @ts-ignore doesn't like two different comparisons after each other with different values
        if (this.currentToken.type !== tt.ASSIGN) {
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                `Expected '=' after identifier after 'var'`
            ));
        }

        res.register(this.advance());
        const expr = res.register(this.expr());
        if (res.error) return res;
        return res.success(new n.N_varAssign(varName, expr, isGlobal));
    }

    private ifExpr (): ParseResults {
        const res = new ParseResults();
        let ifTrue;
        let ifFalse;
        let condition;

        if (!this.currentToken.matches(tt.KEYWORD, 'if'))
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected 'if'"
            ));

        res.register(this.advance());

        if (this.currentToken.type !== tt.OPAREN)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected '(' after 'if'"
            ));

        res.register(this.advance());

        condition = res.register(this.expr());
        if (res.error) return res;

        // @ts-ignore - comparison again
        if (this.currentToken.type !== tt.CPAREN)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected ')' after 'if (condition'"
            ));

        res.register(this.advance());

        if (this.currentToken.type !== tt.OBRACES)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected '{' after 'if (condition)'"
            ));
        res.register(this.advance());

        ifTrue = res.register(this.expr());
        if (res.error) return res;

        if (this.currentToken.type !== tt.CBRACES)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected '}'"
            ));
        res.register(this.advance());

        if (this.currentToken.matches(tt.KEYWORD, 'else')) {
            res.register(this.advance());

            if (this.currentToken.type !== tt.OBRACES)
                return res.failure(new InvalidSyntaxError(
                    this.currentToken.startPos,
                    this.currentToken.endPos,
                    "Expected '{'"
                ));
            res.register(this.advance());

            ifFalse = res.register(this.expr());
            if (res.error) return res;

            if (this.currentToken.type !== tt.CBRACES)
                return res.failure(new InvalidSyntaxError(
                    this.currentToken.startPos,
                    this.currentToken.endPos,
                    "Expected '}'"
                ));
            res.register(this.advance());
        }

        return res.success(new n.N_if(condition, ifTrue, ifFalse));
    }

    private whileExpr (): ParseResults {
        const res = new ParseResults();
        let loop;
        let condition;

        if (!this.currentToken.matches(tt.KEYWORD, 'while'))
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected 'while'"
            ));

        res.register(this.advance());

        if (this.currentToken.type !== tt.OPAREN)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected '(' after 'while'"
            ));

        res.register(this.advance());

        condition = res.register(this.expr());
        if (res.error) return res;

        // @ts-ignore - comparison again
        if (this.currentToken.type !== tt.CPAREN)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected ')' after 'while (condition'"
            ));

        res.register(this.advance());

        if (this.currentToken.type !== tt.OBRACES)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected '{' after 'while (condition)'"
            ));
        res.register(this.advance());

        loop = res.register(this.expr());
        if (res.error) return res;

        if (this.currentToken.type !== tt.CBRACES)
            return res.failure(new InvalidSyntaxError(
                this.currentToken.startPos,
                this.currentToken.endPos,
                "Expected '}'"
            ));
        res.register(this.advance());

        return res.success(new n.N_while(condition, loop));
    }
}