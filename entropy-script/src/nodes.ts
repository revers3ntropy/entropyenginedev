import {notFoundVariable, tokenTypeString, tt} from "./constants.js";
import {Token} from "./tokens.js";
import {ESError, InvalidSyntaxError} from "./errors.js";
import {Context} from "./context.js";

export abstract class Node {
    abstract interpret (context: Context): any;
}

// --- NON-TERMINAL NODES ---

export class N_binOp extends Node {
    left: Node;
    right: Node;
    opTok: Token;

    constructor (left: Node, opTok: Token, right: Node) {
        super();
        this.left = left;
        this.opTok = opTok;
        this.right = right;
    }

    interpret(context: Context): any {
        const left = this.left.interpret(context);
        const right = this.right.interpret(context);

        if (left instanceof ESError) return left;
        if (right instanceof ESError) return right;

        switch (this.opTok.type) {
            case tt.ADD:
                return left + right;
            case tt.DIV:
                return left / right;
            case tt.MUL:
                return left * right;
            case tt.SUB:
                return left - right;
            case tt.POW:
                return left ** right;
            case tt.LTE:
                return left <= right;
            case tt.GTE:
                return left >= right;
            case tt.GT:
                return left > right;
            case tt.LT:
                return left < right;
            case tt.EQUALS:
                return left === right;
            case tt.NOTEQUALS:
                return left !== right;
            case tt.AND:
                return left && right;
            case tt.OR:
                return left || right;

            default:
                return 0;
        }
    }
}

export class N_unaryOp extends Node {
    a: Node;
    opTok: Token;

    constructor (a: Node, opTok: Token) {
        super();
        this.a = a;
        this.opTok = opTok;
    }

    interpret(context: Context) {
        const val = this.a.interpret(context);
        if (val instanceof ESError) return val;

        switch (this.opTok.type) {
            case tt.SUB:
                return -val;
            case tt.ADD:
                return val;
            case tt.NOT:
                return !val;
            default:
                return new InvalidSyntaxError(
                    this.opTok.startPos,
                    this.opTok.endPos,
                    `Invalid unary operator: ${tokenTypeString[this.opTok.type]}`
                );

        }
    }
}

export class N_varAssign extends Node {
    value: Node;
    varNameTok: Token;
    isGlobal: boolean;
    constructor(varNameTok: Token, value: Node, isGlobal=false) {
        super();
        this.value = value;
        this.varNameTok = varNameTok;
        this.isGlobal = isGlobal;
    }

    interpret(context: Context): any {
        const val = this.value.interpret(context);
        if (val instanceof ESError)
            return val;

        if (this.isGlobal) {
            while (context.parent !== undefined) {
                context = context.parent;
            }
        }

        context.set(this.varNameTok.value, val);
        return val;
    }
}

export class N_if extends Node {
    comparison: Node;
    ifTrue: Node;
    ifFalse: Node | undefined;

    constructor (comparison: Node, ifTrue: Node, ifFalse: Node | undefined) {
        super();
        this.comparison = comparison;
        this.ifFalse = ifFalse;
        this.ifTrue = ifTrue;
    }

    interpret(context: Context): any {
        let newContext = new Context();
        newContext.parent = context;

        if (this.comparison.interpret(context)) {
            this.ifTrue.interpret(newContext);
        } else if (this.ifFalse) {
            this.ifFalse.interpret(newContext);
        }

        newContext.delete();
    }
}

export class N_while extends Node {
    comparison: Node;
    loop: Node;

    constructor (comparison: Node, loop: Node) {
        super();
        this.comparison = comparison;
        this.loop = loop;
    }

    interpret(context: Context): any {
        let newContext = new Context();
        newContext.parent = context;

        while (this.comparison.interpret(context)) {
            this.loop.interpret(newContext);
        }

        newContext.delete();
    }
}

// --- TERMINAL NODES ---
export class N_number extends Node {
    a: Token;
    constructor(a: Token) {
        super();
        this.a = a;
    }
    interpret (context: Context): number {
        return this.a.value;
    }
}
export class N_variable extends Node {
    a: Token;
    constructor(a: Token) {
        super();
        this.a = a;
    }

    interpret (context: Context) {
        let val = context.get(this.a.value);

        if (val === undefined)
            val = notFoundVariable;

        return val;
    }
}