import { notFoundVariable, tokenTypeString, tt } from "./constants.js";
import { ESError, InvalidSyntaxError } from "./errors.js";
import { Context } from "./context.js";
export class Node {
}
// --- NON-TERMINAL NODES ---
export class N_binOp extends Node {
    constructor(left, opTok, right) {
        super();
        this.left = left;
        this.opTok = opTok;
        this.right = right;
    }
    interpret(context) {
        const left = this.left.interpret(context);
        const right = this.right.interpret(context);
        if (left instanceof ESError)
            return left;
        if (right instanceof ESError)
            return right;
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
                return Math.pow(left, right);
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
    constructor(a, opTok) {
        super();
        this.a = a;
        this.opTok = opTok;
    }
    interpret(context) {
        const val = this.a.interpret(context);
        if (val instanceof ESError)
            return val;
        switch (this.opTok.type) {
            case tt.SUB:
                return -val;
            case tt.ADD:
                return val;
            case tt.NOT:
                return !val;
            default:
                return new InvalidSyntaxError(this.opTok.startPos, this.opTok.endPos, `Invalid unary operator: ${tokenTypeString[this.opTok.type]}`);
        }
    }
}
export class N_varAssign extends Node {
    constructor(varNameTok, value, isGlobal = false) {
        super();
        this.value = value;
        this.varNameTok = varNameTok;
        this.isGlobal = isGlobal;
    }
    interpret(context) {
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
    constructor(comparison, ifTrue, ifFalse) {
        super();
        this.comparison = comparison;
        this.ifFalse = ifFalse;
        this.ifTrue = ifTrue;
    }
    interpret(context) {
        let newContext = new Context();
        newContext.parent = context;
        if (this.comparison.interpret(context)) {
            this.ifTrue.interpret(newContext);
        }
        else if (this.ifFalse) {
            this.ifFalse.interpret(newContext);
        }
        newContext.delete();
    }
}
export class N_while extends Node {
    constructor(comparison, loop) {
        super();
        this.comparison = comparison;
        this.loop = loop;
    }
    interpret(context) {
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
    constructor(a) {
        super();
        this.a = a;
    }
    interpret(context) {
        return this.a.value;
    }
}
export class N_variable extends Node {
    constructor(a) {
        super();
        this.a = a;
    }
    interpret(context) {
        let val = context.get(this.a.value);
        if (val === undefined)
            val = notFoundVariable;
        return val;
    }
}
