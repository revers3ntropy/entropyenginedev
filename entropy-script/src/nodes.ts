import {None, tokenTypeString, tt, Undefined} from "./constants.js";
import {Token} from "./tokens.js";
import {ESError, InvalidSyntaxError, TypeError, ReferenceError} from "./errors.js";
import {Context} from "./context.js";
import {Position} from "./position.js";
import {deepClone} from "./util.js";

export class interpretResult {
    val: any | undefined;
    error: ESError | undefined;
    funcReturn: any | undefined;
    shouldBreak = false;
    shouldContinue = false;
}

export abstract class Node {
    startPos: Position;
    endPos: Position;
    protected constructor (startPos: Position, endPos: Position) {
        this.endPos = endPos;
        this.startPos = startPos;
    }
    abstract interpret_ (context: Context): Promise<any>;

    async interpret (context: Context): Promise<interpretResult> {
        const res = new interpretResult();
        const val = await this.interpret_(context);

        if (val instanceof ESError)
            res.error = val;

        else if (val instanceof interpretResult) {
            res.val = val.val;
            res.error = val.error;
            res.funcReturn = val.funcReturn;
            res.shouldBreak = val.shouldBreak;
            res.shouldContinue = val.shouldContinue;

        } else
            res.val = val;

        return res;
    }
}

// --- NON-TERMINAL NODES ---

export class N_binOp extends Node {
    left: Node;
    right: Node;
    opTok: Token;

    constructor (startPos: Position, endPos: Position, left: Node, opTok: Token, right: Node) {
        super(startPos, endPos);
        this.left = left;
        this.opTok = opTok;
        this.right = right;
    }

    async interpret_(context: Context): Promise<any> {
        const left = await this.left.interpret(context);
        const right = await this.right.interpret(context);

        if (left.error) return left;
        if (right.error) return right;

        const l = left.val;
        const r = right.val;

        switch (this.opTok.type) {
            case tt.ADD:
                return l + r;
            case tt.DIV:
                return l / r;
            case tt.MUL:
                return l * r;
            case tt.SUB:
                return l - r;
            case tt.POW:
                return l ** r;
            case tt.LTE:
                return l <= r;
            case tt.GTE:
                return l >= r;
            case tt.GT:
                return l > r;
            case tt.LT:
                return l < r;
            case tt.EQUALS:
                return l === r;
            case tt.NOTEQUALS:
                return l !== r;
            case tt.AND:
                return l && r;
            case tt.OR:
                return l || r;

            default:
                return 0;
        }
    }
}

export class N_unaryOp extends Node {
    a: Node;
    opTok: Token;

    constructor (startPos: Position, endPos: Position, a: Node, opTok: Token) {
        super(startPos, endPos);
        this.a = a;
        this.opTok = opTok;
    }

    async interpret_(context: Context) {
        const res = await this.a.interpret(context);
        if (res.error) return res;

        switch (this.opTok.type) {
            case tt.SUB:
                return -res.val;
            case tt.ADD:
                return res.val;
            case tt.NOT:
                if (res.val instanceof Undefined)
                    return true;
                return !res.val;
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
    constructor(startPos: Position, endPos: Position, varNameTok: Token, value: Node, isGlobal=false) {
        super(startPos, endPos);
        this.value = value;
        this.varNameTok = varNameTok;
        this.isGlobal = isGlobal;
    }

    async interpret_(context: Context): Promise<any> {
        const res = await this.value.interpret(context);
        if (res.error) return res;
        context.set(this.varNameTok.value, res.val, this.isGlobal);
        return res;
    }
}

export class N_if extends Node {
    comparison: Node;
    ifTrue: Node;
    ifFalse: Node | undefined;

    constructor (startPos: Position, endPos: Position,comparison: Node, ifTrue: Node, ifFalse: Node | undefined) {
        super(startPos, endPos);
        this.comparison = comparison;
        this.ifFalse = ifFalse;
        this.ifTrue = ifTrue;
    }

    async interpret_(context: Context): Promise<any> {
        let newContext = new Context();
        newContext.parent = context;
        let res: any = None;

        let compRes = await this.comparison.interpret(context);
        if (compRes.error) return compRes;

        if (compRes.val) {
            res = await this.ifTrue.interpret(newContext);
            // so that if statements always return a value of None
            res.val = None;
            if (res.error) return res;

        } else if (this.ifFalse) {
            res = await this.ifFalse.interpret(newContext);
            // so that if statements always return a value of None
            res.val = None;
            if (res.error) return res;
        }

        newContext.delete();
        return res;
    }
}

export class N_while extends Node {
    comparison: Node;
    loop: Node;

    constructor (startPos: Position, endPos: Position, comparison: Node, loop: Node) {
        super(startPos, endPos);
        this.comparison = comparison;
        this.loop = loop;
    }

    async interpret_(context: Context): Promise<any> {
        let newContext = new Context();
        newContext.parent = context;

        while (true) {
            let shouldLoop = await this.comparison.interpret(context);
            if (shouldLoop.error) return shouldLoop;

            if (!shouldLoop.val) break;

            let potentialError = await this.loop.interpret(newContext)
            if (potentialError.error) return potentialError;
        }

        newContext.delete();
        return None;
    }
}

export class N_for extends Node {
    array: Node;
    body: Node;
    identifier: Token;
    isGlobalId: boolean;

    constructor (startPos: Position, endPos: Position, body: Node, array: Node, identifier: Token, isGlobalIdentifier: boolean) {
        super(startPos, endPos);
        this.body = body;
        this.array = array;
        this.identifier = identifier;
        this.isGlobalId = isGlobalIdentifier;
    }

    async interpret_ (context: Context): Promise<any> {
        let newContext = new Context();
        newContext.parent = context;
        let res: any = None;

        const array = await this.array.interpret(context);
        if (array.error) return array;

        if (!Array.isArray(array.val) && typeof array.val !== 'string' && typeof array.val !== 'object') return new TypeError(
            this.identifier.startPos,
            this.identifier.endPos,
            'array | string',
            typeof array.val
        );

        async function iteration (element: any, self: any) {

        }

        if (typeof array.val === 'object' && !Array.isArray(array.val)) {
            for (let element in array.val) {
                newContext.set(this.identifier.value, element, this.isGlobalId);
                res = await this.body.interpret(newContext);
                // so that if statements always return a value of None
                if (res.error || res.funcReturn) return res;
            }
        } else {
            for (let element of array.val) {
                newContext.set(this.identifier.value, element, this.isGlobalId);
                res = await this.body.interpret(newContext);
                // so that if statements always return a value of None
                if (res.error || res.funcReturn) return res;
            }
        }

        newContext.delete();

        return res;
    }
}

export class N_array extends Node {
    items: Node[];
    constructor(startPos: Position, endPos: Position, items: Node[]) {
        super(startPos, endPos);
        this.items = items;
    }

    async interpret_ (context: Context) {
        let interpreted: any[] = [];

        for (let item of this.items) {
            const value = await item.interpret(context);
            if (value.error) return value;
            interpreted.push(deepClone(value.val));
        }

        return interpreted;
    }
}

export class N_objectLiteral extends Node {
    properties: [Node, Node][];
    constructor(startPos: Position, endPos: Position, properties: [Node, Node][]) {
        super(startPos, endPos);
        this.properties = properties;
    }

    async interpret_ (context: Context) {
        let interpreted: any = {};

        for (const [keyNode, valueNode] of this.properties) {
            const value = await valueNode.interpret(context);
            if (value.error) return value;

            const key = await keyNode.interpret(context);
            if (key.error) return key;

            interpreted[key.val] = deepClone(value.val);
        }

        return interpreted;
    }
}

export class N_emptyObject extends Node {
    constructor(startPos: Position, endPos: Position) {
        super(startPos, endPos);
    }

    async interpret_ (context: Context) {
        return {};
    }
}

export class N_statements extends Node {
    items: Node[];
    constructor(startPos: Position, endPos: Position, items: Node[]) {
        super(startPos, endPos);
        this.items = items;
    }

    async interpret_ (context: Context) {
        for (let item of this.items) {
            const res = await item.interpret(context);
            if (res.error || res.funcReturn) return res;
        }

        return None;
    }
}

export class N_functionCall extends Node {
    arguments: Node[];
    to: Node

    constructor(startPos: Position, endPos: Position, to: Node, args: Node[]) {
        super(startPos, endPos);
        this.arguments = args;
        this.to = to;
    }

    async interpret_ (context: Context): Promise<any> {
        let func = await this.to.interpret(context);
        if (func.error) return func;

        if (func.val instanceof N_function) {
            return await this.runFunc(func.val, context);
        }

        else if (func.val instanceof N_builtInFunction)
            return await this.runBuiltInFunction(func.val, context);

        else
            return new TypeError(this.startPos, this.endPos, "function", typeof func.val);
    }

    async genContext (context: Context, args: string[]) {
        const newContext = new Context();
        newContext.parent = context;

        let i = 0;
        for (let param of args) {
            if (this.arguments.length-1 < i) break;
            let value = await this.arguments[i].interpret(context);
            if (value.error) return value.error;
            newContext.set(param, value.val);
            i++;
        }

        return newContext;
    }

    async runFunc (func: N_function, context: Context) {
        const newContext = await this.genContext(context, func.arguments);
        if (newContext instanceof ESError) return newContext;
        const res = await func.body.interpret(newContext);
        // console.log('return: ', res);
        if (res.funcReturn && !(res.funcReturn instanceof Undefined)) {
            res.val = res.funcReturn;
            res.funcReturn = undefined;
        }
        return res;
    }

    async runBuiltInFunction (func: N_builtInFunction, context: Context) {
        const newContext = await this.genContext(context, func.argNames);
        if (newContext instanceof ESError) return newContext;
        return await func.interpret(newContext);
    }
}

export class N_function extends Node {
    body: Node;
    arguments: string[];
    constructor(startPos: Position, endPos: Position, body: Node, argNames: string[]) {
        super(startPos, endPos);
        this.arguments = argNames;
        this.body = body;
    }

    interpret_ (context: Context): any {
        return this;
    }
}

export class N_builtInFunction extends Node {
    func: (context: Context) => Promise<any>;
    argNames: string[];
    constructor(func: (context: Context) => Promise<any>, argNames: string[]) {
        super(Position.unknown, Position.unknown);
        this.func = func;
        this.argNames = argNames;
    }

    async interpret_ (context: Context) {
        // never called except to execute, so can use this function
        return await this.func(context);
    }
}

export class N_return extends Node {
    value: Node | undefined;
    constructor(startPos: Position, endPos: Position, value: Node | undefined) {
        super(startPos, endPos);
        this.value = value;
    }

    async interpret_ (context: Context) {
        if (!this.value) return None;

        let val = await this.value.interpret(context);
        if (val.error) return val.error;
        const res = new interpretResult();
        res.funcReturn = val.val;
        return res;
    }
}

export class N_indexed extends Node {
    base: Node;
    index: Node;
    value: Node | undefined;

    constructor(startPos: Position, endPos: Position, base: Node, index: Node) {
        super(startPos, endPos);
        this.base = base;
        this.index = index;
    }

    async interpret_ (context: Context) {
        let baseRes = await this.base.interpret(context);
        if (baseRes.error) return baseRes;

        let indexRes = await this.index.interpret(context);
        if (indexRes.error) return indexRes;

        const index = indexRes.val;
        const base = baseRes.val;

        if (!['string', 'number'].includes(typeof index))
            return new TypeError(
                this.startPos, this.endPos,
                'string | number',
                typeof index,
                index,
                `With base ${base} and index ${index}`
            );

        if (typeof base !== 'object' && typeof base !== 'string')
            return new TypeError(
                this.startPos, this.endPos,
                'object | array',
                typeof base
            );

        if (this.value) {
            let valRes = await this.value.interpret(context);
            if (valRes.error) return valRes;

            base[index] = valRes.val ?? None;
        }

        return base[index];
    }
}

// --- TERMINAL NODES ---
export class N_number extends Node {
    a: Token;
    constructor(startPos: Position, endPos: Position, a: Token) {
        super(startPos, endPos);
        this.a = a;
    }
    async interpret_ (context: Context): Promise<number | ESError> {
        if (typeof this.a.value !== 'number') return new TypeError(
            this.startPos, this.endPos,
            'number',
            typeof this.a.value
        );

        return this.a.value;
    }
}

export class N_string extends Node {
    a: Token;
    constructor (startPos: Position, endPos: Position, a: Token) {
        super(startPos, endPos);
        this.a = a;
    }
    async interpret_ (context: Context): Promise<string | ESError> {
        if (typeof this.a.value !== 'string') return new TypeError(
            this.startPos, this.endPos,
            'string',
            typeof this.a.value
        );

        return this.a.value;
    }
}

export class N_variable extends Node {
    a: Token;
    constructor(startPos: Position, endPos: Position, a: Token) {
        super(startPos, endPos);
        this.a = a;
    }

    async interpret_ (context: Context) {
        let val = context.get(this.a.value);

        if (val === undefined)
            return new ReferenceError(this.a.startPos, this.a.endPos, this.a.value);

        if (val instanceof Undefined)
            val = None;

        return val;
    }
}

export class N_undefined extends Node {

    constructor(startPos: Position, endPos: Position) {
        super(startPos, endPos);
    }

    async interpret_ (context: Context) {
        return None;
    }
}

