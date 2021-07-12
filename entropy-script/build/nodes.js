var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { None, tokenTypeString, tt, Undefined } from "./constants.js";
import { ESError, InvalidSyntaxError, TypeError, ReferenceError } from "./errors.js";
import { Context } from "./context.js";
import { Position } from "./position.js";
export class interpretResult {
    constructor() {
        this.shouldBreak = false;
        this.shouldContinue = false;
    }
}
export class Node {
    constructor(startPos, endPos) {
        this.endPos = endPos;
        this.startPos = startPos;
    }
    interpret(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = new interpretResult();
            const val = yield this.interpret_(context);
            if (val instanceof ESError)
                res.error = val;
            else if (val instanceof interpretResult) {
                res.val = val.val;
                res.error = val.error;
                res.funcReturn = val.funcReturn;
                res.shouldBreak = val.shouldBreak;
                res.shouldContinue = val.shouldContinue;
            }
            else
                res.val = val;
            return res;
        });
    }
}
// --- NON-TERMINAL NODES ---
export class N_binOp extends Node {
    constructor(startPos, endPos, left, opTok, right) {
        super(startPos, endPos);
        this.left = left;
        this.opTok = opTok;
        this.right = right;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const left = yield this.left.interpret(context);
            const right = yield this.right.interpret(context);
            if (left.error)
                return left;
            if (right.error)
                return right;
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
                    return Math.pow(l, r);
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
        });
    }
}
export class N_unaryOp extends Node {
    constructor(startPos, endPos, a, opTok) {
        super(startPos, endPos);
        this.a = a;
        this.opTok = opTok;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.a.interpret(context);
            if (res.error)
                return res;
            switch (this.opTok.type) {
                case tt.SUB:
                    return -res.val;
                case tt.ADD:
                    return res.val;
                case tt.NOT:
                    return !res.val;
                default:
                    return new InvalidSyntaxError(this.opTok.startPos, this.opTok.endPos, `Invalid unary operator: ${tokenTypeString[this.opTok.type]}`);
            }
        });
    }
}
export class N_varAssign extends Node {
    constructor(startPos, endPos, varNameTok, value, isGlobal = false) {
        super(startPos, endPos);
        this.value = value;
        this.varNameTok = varNameTok;
        this.isGlobal = isGlobal;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.value.interpret(context);
            if (res.error)
                return res;
            context.set(this.varNameTok.value, res.val, this.isGlobal);
            return res;
        });
    }
}
export class N_if extends Node {
    constructor(startPos, endPos, comparison, ifTrue, ifFalse) {
        super(startPos, endPos);
        this.comparison = comparison;
        this.ifFalse = ifFalse;
        this.ifTrue = ifTrue;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let newContext = new Context();
            newContext.parent = context;
            let res = None;
            let compRes = yield this.comparison.interpret(context);
            if (compRes.error)
                return compRes;
            if (compRes.val) {
                res = yield this.ifTrue.interpret(newContext);
                // so that if statements always return a value of None
                res.val = None;
                if (res.error)
                    return res;
            }
            else if (this.ifFalse) {
                res = yield this.ifFalse.interpret(newContext);
                // so that if statements always return a value of None
                res.val = None;
                if (res.error)
                    return res;
            }
            newContext.delete();
            return res;
        });
    }
}
export class N_while extends Node {
    constructor(startPos, endPos, comparison, loop) {
        super(startPos, endPos);
        this.comparison = comparison;
        this.loop = loop;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let newContext = new Context();
            newContext.parent = context;
            while (true) {
                let shouldLoop = yield this.comparison.interpret(context);
                if (shouldLoop.error)
                    return shouldLoop;
                if (!shouldLoop.val)
                    break;
                let potentialError = yield this.loop.interpret(newContext);
                if (potentialError.error)
                    return potentialError;
            }
            newContext.delete();
            return None;
        });
    }
}
export class N_for extends Node {
    constructor(startPos, endPos, body, array, identifier, isGlobalIdentifier) {
        super(startPos, endPos);
        this.body = body;
        this.array = array;
        this.identifier = identifier;
        this.isGlobalId = isGlobalIdentifier;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let newContext = new Context();
            newContext.parent = context;
            let res = None;
            const array = yield this.array.interpret(context);
            if (array.error)
                return array;
            if (!Array.isArray(array.val) && typeof array.val !== 'string')
                return new TypeError(this.identifier.startPos, this.identifier.endPos, 'array | string', typeof array.val);
            for (let element of array.val) {
                newContext.set(this.identifier.value, element, this.isGlobalId);
                res = yield this.body.interpret(newContext);
                // so that if statements always return a value of None
                if (res.error || res.funcReturn)
                    return res;
            }
            newContext.delete();
            return res;
        });
    }
}
export class N_array extends Node {
    constructor(startPos, endPos, items) {
        super(startPos, endPos);
        this.items = items;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let interpreted = [];
            for (let item of this.items) {
                const value = yield item.interpret(context);
                if (value.error)
                    return value;
                interpreted.push(value.val);
            }
            return interpreted;
        });
    }
}
export class N_statements extends Node {
    constructor(startPos, endPos, items) {
        super(startPos, endPos);
        this.items = items;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let item of this.items) {
                const res = yield item.interpret(context);
                if (res.error || res.funcReturn)
                    return res;
            }
            return None;
        });
    }
}
export class N_functionCall extends Node {
    constructor(startPos, endPos, functionID, args) {
        super(startPos, endPos);
        this.arguments = args;
        this.functionID = functionID;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let func = context.get(this.functionID.value);
            if (func === undefined)
                return new ReferenceError(this.functionID.startPos, this.functionID.endPos, this.functionID.value);
            else if (func instanceof N_function)
                return yield this.runFunc(func, context);
            else if (func instanceof N_builtInFunction)
                return yield this.runBuiltInFunction(func, context);
            else
                return new TypeError(this.startPos, this.endPos, "function", typeof func);
        });
    }
    genContext(context, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const newContext = new Context();
            newContext.parent = context;
            let i = 0;
            for (let param of args) {
                if (this.arguments.length - 1 < i)
                    break;
                let value = yield this.arguments[i].interpret(context);
                if (value.error)
                    return value.error;
                newContext.set(param, value.val);
                i++;
            }
            return newContext;
        });
    }
    runFunc(func, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const newContext = yield this.genContext(context, func.arguments);
            if (newContext instanceof ESError)
                return newContext;
            return func.body.interpret(newContext);
        });
    }
    runBuiltInFunction(func, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const newContext = yield this.genContext(context, func.argNames);
            if (newContext instanceof ESError)
                return newContext;
            return yield func.interpret(newContext);
        });
    }
}
export class N_function extends Node {
    constructor(startPos, endPos, body, argNames) {
        super(startPos, endPos);
        this.arguments = argNames;
        this.body = body;
    }
    interpret_(context) {
        return this;
    }
}
export class N_builtInFunction extends Node {
    constructor(func, argNames) {
        super(Position.unknown, Position.unknown);
        this.func = func;
        this.argNames = argNames;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            // never called except to execute, so can use this function
            return yield this.func(context);
        });
    }
}
export class N_return extends Node {
    constructor(startPos, endPos, value) {
        super(startPos, endPos);
        this.value = value;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.value)
                return undefined;
            let val = yield this.value.interpret(context);
            if (val.error)
                return val.error;
            const res = new interpretResult();
            res.funcReturn = val;
            return res;
        });
    }
}
// --- TERMINAL NODES ---
export class N_number extends Node {
    constructor(startPos, endPos, a) {
        super(startPos, endPos);
        this.a = a;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.a.value !== 'number')
                return new TypeError(this.startPos, this.endPos, 'number', typeof this.a.value);
            return this.a.value;
        });
    }
}
export class N_string extends Node {
    constructor(startPos, endPos, a) {
        super(startPos, endPos);
        this.a = a;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.a.value !== 'string')
                return new TypeError(this.startPos, this.endPos, 'string', typeof this.a.value);
            return this.a.value;
        });
    }
}
export class N_variable extends Node {
    constructor(startPos, endPos, a) {
        super(startPos, endPos);
        this.a = a;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let val = context.get(this.a.value);
            if (val === undefined)
                return new ReferenceError(this.a.startPos, this.a.endPos, this.a.value);
            if (val instanceof Undefined)
                val = None;
            return val;
        });
    }
}
export class N_undefined extends Node {
    constructor(startPos, endPos) {
        super(startPos, endPos);
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return None;
        });
    }
}
