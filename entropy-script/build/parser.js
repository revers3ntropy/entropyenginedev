import { Token } from "./tokens.js";
import * as n from './nodes.js';
import { InvalidSyntaxError } from "./errors.js";
import { tokenType, tokenTypeString, tt } from "./constants.js";
export class ParseResults {
    constructor() {
        this.advanceCount = 0;
        this.lastRegisteredAdvanceCount = 0;
        this.reverseCount = 0;
    }
    registerAdvance() {
        this.advanceCount = 1;
        this.lastRegisteredAdvanceCount += 1;
    }
    register(res) {
        this.lastRegisteredAdvanceCount = res.advanceCount;
        this.advanceCount += res.advanceCount;
        if (res.error)
            this.error = res.error;
        return res.node;
    }
    tryRegister(res) {
        if (res.error) {
            this.reverseCount += res.advanceCount;
            return;
        }
        return this.register(res);
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
        if (!this.currentToken || !this.tokens || (this.tokens.length === 1 && this.tokens[0].type === tt.EOF))
            return new ParseResults();
        const res = this.statements(true);
        if (!res.error && this.currentToken.type !== tokenType.EOF) {
            return res.failure(new InvalidSyntaxError((_a = this.currentToken) === null || _a === void 0 ? void 0 : _a.startPos, (_b = this.currentToken) === null || _b === void 0 ? void 0 : _b.endPos, `Expected 'End of File', got token of type'${tokenTypeString[this.currentToken.type]}' of value ${this.currentToken.value}`));
        }
        return res;
    }
    advance(res) {
        if (res)
            res.registerAdvance();
        this.tokenIdx++;
        this.currentToken = this.tokens[this.tokenIdx];
        return this.currentToken;
    }
    reverse(amount = 1) {
        this.tokenIdx -= amount;
        this.currentToken = this.tokens[this.tokenIdx];
        return this.currentToken;
    }
    clearEndStatements(res) {
        while (this.currentToken.type === tt.ENDSTATEMENT) {
            this.advance(res);
        }
    }
    statements(useArray = false) {
        const res = new ParseResults();
        const startPos = this.currentToken.startPos;
        let statements = [];
        this.clearEndStatements(res);
        statements.push(res.register(this.statement()));
        if (res.error)
            return res;
        let moreStatements = true;
        while (true) {
            let newLineCount = 0;
            // @ts-ignore
            while (this.currentToken.type === tt.ENDSTATEMENT) {
                this.advance(res);
                newLineCount++;
            }
            if (newLineCount === 0)
                moreStatements = false;
            if (!moreStatements)
                break;
            const statement = res.tryRegister(this.statement());
            if (!statement) {
                this.reverse(res.reverseCount);
                continue;
            }
            statements.push(statement);
        }
        this.clearEndStatements(res);
        let node = new n.N_statements(startPos, this.currentToken.startPos.clone, statements);
        if (useArray)
            node = new n.N_array(startPos, this.currentToken.startPos.clone, statements);
        return res.success(node);
    }
    statement() {
        const res = new ParseResults();
        const startPos = this.currentToken.startPos;
        if (this.currentToken.matches(tt.KEYWORD, 'return')) {
            this.advance(res);
            const expr = res.tryRegister(this.expr());
            if (!expr)
                this.reverse(res.reverseCount);
            return res.success(new n.N_return(startPos, this.currentToken.startPos.clone, expr));
        }
        const expr = res.register(this.expr());
        if (res.error)
            return res;
        return res.success(expr);
    }
    atom() {
        const res = new ParseResults();
        const tok = this.currentToken;
        switch (tok.type) {
            case tt.NUMBER:
                this.advance(res);
                return res.success(new n.N_number(tok.startPos, tok.endPos, tok));
            case tt.STRING:
                this.advance(res);
                return res.success(new n.N_string(tok.startPos, tok.endPos, tok));
            case tt.IDENTIFIER:
                this.advance(res);
                if (this.currentToken.type === tt.OPAREN) {
                    const expr = res.register(this.makeFunctionCall(tok));
                    if (res.error)
                        return res;
                    return res.success(expr);
                }
                else if (this.currentToken.type === tt.ASSIGN) {
                    this.reverse();
                    const expr = res.register(this.assign(res, false));
                    if (res.error)
                        return res;
                    return res.success(expr);
                }
                return res.success(new n.N_variable(tok.startPos, tok.endPos, tok));
            case tt.OPAREN:
                this.advance(res);
                const expr = res.register(this.expr());
                if (res.error)
                    return res;
                if (this.currentToken.type == tt.CPAREN) {
                    this.advance(res);
                    return res.success(expr);
                }
                return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected ')'"));
            case tt.OSQUARE:
                let arrayExpr = res.register(this.array());
                if (res.error)
                    return res;
                return res.success(arrayExpr);
            case tt.KEYWORD:
                switch (tok.value) {
                    case 'if':
                        const expr = res.register(this.ifExpr());
                        if (res.error)
                            return res;
                        return res.success(expr);
                    default:
                        return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, `Invalid Identifier ${tok.value}`));
                }
            default:
                return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, `Expected number, identifier, '(', '+' or '-'`));
        }
    }
    power() {
        return this.binOp(() => this.atom(), [tokenType.POW], () => this.factor());
    }
    factor() {
        const res = new ParseResults();
        const tok = this.currentToken;
        switch (tok.type) {
            case tt.SUB:
            case tt.ADD:
                this.advance(res);
                const factor = res.register(this.factor());
                if (res.error)
                    return res;
                return res.success(new n.N_unaryOp(tok.startPos, factor.endPos, factor, tok));
            default:
                return this.power();
        }
    }
    term() {
        return this.binOp(() => this.factor(), [tt.MUL, tt.DIV]);
    }
    arithmeticExpr() {
        return this.binOp(() => this.term(), [tt.ADD, tt.SUB]);
    }
    comparisonExpr() {
        const res = new ParseResults();
        if (this.currentToken.type === tt.NOT) {
            const opTok = this.currentToken;
            this.advance(res);
            let node = res.register(this.comparisonExpr());
            if (res.error)
                return res;
            return res.success(new n.N_unaryOp(opTok.startPos, node.endPos, node, opTok));
        }
        let node = res.register(this.binOp(() => this.arithmeticExpr(), [tt.EQUALS, tt.NOTEQUALS, tt.GT, tt.GTE, tt.LTE, tt.LT]));
        if (res.error)
            return res;
        return res.success(node);
    }
    expr() {
        const res = new ParseResults();
        this.clearEndStatements(res);
        if (this.currentToken.matches(tokenType.KEYWORD, 'var')) {
            const exp = res.register(this.assign(res, false));
            if (res.error)
                return res;
            return res.success(exp);
        }
        else if (this.currentToken.matches(tokenType.KEYWORD, 'global')) {
            const exp = res.register(this.assign(res, true));
            if (res.error)
                return res;
            return res.success(exp);
        }
        else if (this.currentToken.matches(tokenType.KEYWORD, 'if')) {
            const exp = res.register(this.ifExpr());
            if (res.error)
                return res;
            return res.success(exp);
        }
        else if (this.currentToken.matches(tokenType.KEYWORD, 'while')) {
            const exp = res.register(this.whileExpr());
            if (res.error)
                return res;
            return res.success(exp);
        }
        else if (this.currentToken.matches(tokenType.KEYWORD, 'for')) {
            const exp = res.register(this.forExpr());
            if (res.error)
                return res;
            return res.success(exp);
        }
        else if (this.currentToken.matches(tokenType.KEYWORD, 'func')) {
            const exp = res.register(this.funcExpr());
            if (res.error)
                return res;
            return res.success(exp);
        }
        let node = res.register(this.binOp(() => this.comparisonExpr(), [tt.AND, tt.OR]));
        if (res.error)
            return res;
        return res.success(node);
    }
    binOp(func, ops, funcB = func) {
        const res = new ParseResults();
        let left = res.register(func());
        if (res.error)
            return res;
        while (
        // @ts-ignore
        ops.indexOf(this.currentToken.type) !== -1
            // @ts-ignore
            || ops.indexOf([this.currentToken.type, this.currentToken.value]) !== -1) {
            const opTok = this.currentToken;
            this.advance(res);
            const right = res.register(funcB());
            if (res.error)
                return res;
            left = new n.N_binOp(left.startPos, right.endPos, left, opTok, right);
        }
        return res.success(left);
    }
    makeFunctionCall(identifier) {
        const res = new ParseResults();
        let args = [];
        const startPos = this.currentToken.startPos;
        if (this.currentToken.type !== tt.OPAREN)
            return res.failure(new InvalidSyntaxError(startPos, this.currentToken.endPos, "Expected '["));
        this.advance(res);
        // @ts-ignore
        if (this.currentToken.type === tt.CPAREN) {
            this.advance(res);
            return res.success(new n.N_functionCall(startPos, this.currentToken.endPos, identifier, []));
        }
        args.push(res.register(this.expr()));
        if (res.error)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Invalid argument"));
        // @ts-ignore
        while (this.currentToken.type === tt.COMMA) {
            this.advance(res);
            args.push(res.register(this.expr()));
            if (res.error)
                return res;
        }
        // @ts-ignore
        if (this.currentToken.type !== tt.CPAREN)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected ',' or ')'"));
        this.advance(res);
        return res.success(new n.N_functionCall(startPos, this.currentToken.endPos, identifier, args));
    }
    assign(res, isGlobal) {
        let startPos = this.currentToken.startPos;
        if (this.currentToken.type === tt.KEYWORD) {
            if (['global', 'var'].indexOf(this.currentToken.value) === -1)
                return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, `Expected Identifier 'var' or 'global', not ${this.currentToken.value}`));
            this.advance(res);
        }
        if (this.currentToken.type !== tokenType.IDENTIFIER) {
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, `Expected Identifier`));
        }
        const varName = this.currentToken;
        this.advance(res);
        // @ts-ignore doesn't like two different comparisons after each other with different values
        if (this.currentToken.type !== tt.ASSIGN) {
            return res.success(new n.N_varAssign(startPos, this.currentToken.startPos, varName, new n.N_undefined(this.currentToken.startPos, this.currentToken.endPos), isGlobal));
        }
        this.advance(res);
        const expr = res.register(this.expr());
        if (res.error)
            return res;
        return res.success(new n.N_varAssign(startPos, this.currentToken.startPos, varName, expr, isGlobal));
    }
    bracesExp() {
        const res = new ParseResults();
        if (this.currentToken.type !== tt.OBRACES) {
            const expr = res.register(this.statement());
            if (res.error)
                return res;
            this.clearEndStatements(res);
            return res.success(expr);
        }
        // clear brace
        this.advance(res);
        this.clearEndStatements(res);
        // @ts-ignore
        if (this.currentToken.type === tt.CBRACES) {
            this.advance(res);
            return res.success(new n.N_undefined(this.currentToken.startPos, this.currentToken.endPos));
        }
        const expr = res.register(this.statements());
        if (res.error)
            return res;
        // @ts-ignore
        if (this.currentToken.type !== tt.CBRACES)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected '}'"));
        this.advance(res);
        return res.success(expr);
    }
    addEndStatement(res) {
        this.tokens.splice(this.tokenIdx, 0, new Token(this.currentToken.startPos, this.currentToken.endPos, tt.ENDSTATEMENT));
        this.reverse();
        this.advance(res);
    }
    ifExpr() {
        const res = new ParseResults();
        let ifTrue;
        let ifFalse;
        let condition;
        const startPos = this.currentToken.startPos;
        if (!this.currentToken.matches(tt.KEYWORD, 'if'))
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected 'if'"));
        this.advance(res);
        if (this.currentToken.type !== tt.OPAREN)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected '(' after 'if'"));
        this.advance(res);
        condition = res.register(this.expr());
        if (res.error)
            return res;
        // @ts-ignore - comparison again
        if (this.currentToken.type !== tt.CPAREN)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected ')' after 'if (condition'"));
        this.advance(res);
        ifTrue = res.register(this.bracesExp());
        if (res.error)
            return res;
        this.clearEndStatements(res);
        if (this.currentToken.matches(tt.KEYWORD, 'else')) {
            this.advance(res);
            ifFalse = res.register(this.bracesExp());
            if (res.error)
                return res;
        }
        this.addEndStatement(res);
        return res.success(new n.N_if(startPos, this.currentToken.startPos, condition, ifTrue, ifFalse));
    }
    whileExpr() {
        const res = new ParseResults();
        let loop;
        let condition;
        const startPos = this.currentToken.startPos;
        if (!this.currentToken.matches(tt.KEYWORD, 'while'))
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected 'while'"));
        this.advance(res);
        if (this.currentToken.type !== tt.OPAREN)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected '(' after 'while'"));
        this.advance(res);
        condition = res.register(this.expr());
        if (res.error)
            return res;
        // @ts-ignore - comparison again
        if (this.currentToken.type !== tt.CPAREN)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected ')' after 'while (condition'"));
        this.advance(res);
        loop = res.register(this.bracesExp());
        if (res.error)
            return res;
        this.addEndStatement(res);
        return res.success(new n.N_while(startPos, this.currentToken.startPos, condition, loop));
    }
    funcExpr() {
        const res = new ParseResults();
        const startPos = this.currentToken.startPos;
        let body, args = [];
        if (!this.currentToken.matches(tt.KEYWORD, 'func'))
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected 'func'"));
        this.advance(res);
        if (this.currentToken.type !== tt.OPAREN)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected '(' after 'func'"));
        this.advance(res);
        // @ts-ignore
        if (this.currentToken.type === tt.CPAREN) {
            this.advance(res);
            args = [];
        }
        else {
            // @ts-ignore
            if (this.currentToken.type !== tt.IDENTIFIER)
                return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected identifier"));
            args.push(this.currentToken.value);
            this.advance(res);
            // @ts-ignore
            while (this.currentToken.type === tt.COMMA) {
                this.advance(res);
                // @ts-ignore
                if (this.currentToken.type !== tt.IDENTIFIER)
                    return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected identifier"));
                args.push(this.currentToken.value);
                this.advance(res);
            }
            // @ts-ignore
            if (this.currentToken.type !== tt.CPAREN)
                return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected ',' or ')'"));
            this.advance(res);
        }
        body = res.register(this.bracesExp());
        if (res.error)
            return res;
        return res.success(new n.N_function(startPos, this.currentToken.endPos, body, args));
    }
    forExpr() {
        const res = new ParseResults();
        const startPos = this.currentToken.startPos;
        let body, array, identifier, isGlobalIdentifier = false;
        if (!this.currentToken.matches(tt.KEYWORD, 'for'))
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected 'for'"));
        this.advance(res);
        if (this.currentToken.type !== tt.OPAREN)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected '(' after 'for'"));
        this.advance(res);
        if (this.currentToken.matches(tt.KEYWORD, 'global')) {
            isGlobalIdentifier = true;
            this.advance(res);
        }
        else if (this.currentToken.matches(tt.KEYWORD, 'var')) {
            this.advance(res);
        }
        // @ts-ignore - comparison again
        if (this.currentToken.type !== tt.IDENTIFIER)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected identifier"));
        identifier = this.currentToken;
        this.advance(res);
        if (!this.currentToken.matches(tt.KEYWORD, 'in'))
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected keyword 'in"));
        this.advance(res);
        array = res.register(this.expr());
        if (res.error)
            return res;
        // @ts-ignore - comparison again
        if (this.currentToken.type !== tt.CPAREN)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected ')'"));
        this.advance(res);
        body = res.register(this.bracesExp());
        if (res.error)
            return res;
        this.addEndStatement(res);
        return res.success(new n.N_for(startPos, this.currentToken.startPos, body, array, identifier, isGlobalIdentifier));
    }
    array() {
        const res = new ParseResults();
        let elements = [];
        const startPos = this.currentToken.startPos;
        if (this.currentToken.type !== tt.OSQUARE)
            return res.failure(new InvalidSyntaxError(startPos, this.currentToken.endPos, "Expected '["));
        this.advance(res);
        // @ts-ignore
        if (this.currentToken.type === tt.CSQUARE) {
            this.advance(res);
            return res.success(new n.N_array(startPos, this.currentToken.endPos, []));
        }
        elements.push(res.register(this.expr()));
        if (res.error)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected ']', 'var', 'if', 'for', 'while', number, identifier, '+', '-', '(', '[' or '!' 2"));
        // @ts-ignore
        while (this.currentToken.type === tt.COMMA) {
            this.advance(res);
            elements.push(res.register(this.expr()));
            if (res.error)
                return res;
        }
        // @ts-ignore
        if (this.currentToken.type !== tt.CSQUARE)
            return res.failure(new InvalidSyntaxError(this.currentToken.startPos, this.currentToken.endPos, "Expected ',' or ']'"));
        this.advance(res);
        return res.success(new n.N_array(startPos, this.currentToken.endPos, elements));
    }
}