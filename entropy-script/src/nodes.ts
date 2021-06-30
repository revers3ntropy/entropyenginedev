import {notFoundVariable, tokenType, tokenTypeString} from "./constants.js";
import {Token} from "./tokens.js";
import {ESError, InvalidSyntaxError} from "./errors.js";

export abstract class Node {
    abstract interpret (context: object): any;
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

    interpret(context: object): any {
        const left = this.left.interpret(context);
        const right = this.right.interpret(context);

        if (left instanceof ESError) return left;
        if (right instanceof ESError) return right;

        switch (this.opTok.type) {
            case tokenType.ADD:
                return left + right;
            case tokenType.DIV:
                return left / right;
            case tokenType.MUL:
                return left * right;
            case tokenType.SUB:
                return left - right;
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

    interpret(context: object) {
        const val = this.a.interpret(context);
        if (val instanceof ESError) return val;

        switch (this.opTok.type) {
            case tokenType.SUB:
                return -val;
            case tokenType.ADD:
                return val;
            default:
                return new InvalidSyntaxError(
                    this.opTok.startPos,
                    this.opTok.endPos,
                    `Invalid unary operator: ${tokenTypeString[this.opTok.type]}`
                );

        }
    }
}



// --- TERMINAL NODES ---
export class N_number extends Node {
    a: Token;
    constructor(a: Token) {
        super();
        this.a = a;
    }
    interpret (context: any): number {
        return this.a.value;
    }
}
export class N_variable extends Node {
    a: Token;
    constructor(a: Token) {
        super();
        this.a = a;
    }
    interpret (context: any) {
        return context[this.a.value] || notFoundVariable;
    }
}