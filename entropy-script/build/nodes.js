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
import { ESError, InvalidSyntaxError, ReferenceError, TypeError } from "./errors.js";
import { Context } from "./context.js";
import { Position } from "./position.js";
import { deepClone, str } from "./util.js";
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
                    if (res.val instanceof Undefined)
                        return true;
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
                if (potentialError.shouldBreak)
                    break;
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
            if (!Array.isArray(array.val) && typeof array.val !== 'string' && typeof array.val !== 'object')
                return new TypeError(this.identifier.startPos, this.identifier.endPos, 'array | string', typeof array.val);
            if (typeof array.val === 'object' && !Array.isArray(array.val)) {
                for (let element in array.val) {
                    newContext.set(this.identifier.value, element, this.isGlobalId);
                    res = yield this.body.interpret(newContext);
                    // so that if statements always return a value of None
                    if (res.error || (res.funcReturn !== undefined))
                        return res;
                    if (res.shouldBreak) {
                        res.shouldBreak = false;
                        break;
                    }
                    if (res.shouldContinue) {
                        res.shouldContinue = false;
                    }
                }
            }
            else {
                for (let element of array.val) {
                    newContext.set(this.identifier.value, element, this.isGlobalId);
                    res = yield this.body.interpret(newContext);
                    // so that if statements always return a value of None
                    if (res.error || (res.funcReturn !== undefined))
                        return res;
                    if (res.shouldBreak) {
                        res.shouldBreak = false;
                        break;
                    }
                    if (res.shouldContinue) {
                        res.shouldContinue = false;
                    }
                }
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
                const res = yield item.interpret(context);
                if (res.error || (res.funcReturn !== undefined))
                    return res;
                interpreted.push(deepClone(res.val));
            }
            return interpreted;
        });
    }
}
export class N_objectLiteral extends Node {
    constructor(startPos, endPos, properties) {
        super(startPos, endPos);
        this.properties = properties;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let interpreted = {};
            for (const [keyNode, valueNode] of this.properties) {
                const value = yield valueNode.interpret(context);
                if (value.error)
                    return value;
                const key = yield keyNode.interpret(context);
                if (key.error)
                    return key;
                interpreted[key.val] = deepClone(value.val);
            }
            return interpreted;
        });
    }
}
export class N_emptyObject extends Node {
    constructor(startPos, endPos) {
        super(startPos, endPos);
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return {};
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
                if (res.error || (res.funcReturn !== undefined) || res.shouldBreak || res.shouldContinue)
                    return res;
            }
            return None;
        });
    }
}
export class N_functionCall extends Node {
    constructor(startPos, endPos, to, args) {
        super(startPos, endPos);
        this.arguments = args;
        this.to = to;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let func = yield this.to.interpret(context);
            if (func.error)
                return func;
            if (func.val instanceof N_function)
                return yield this.runFunc(func.val, context);
            else if (func.val instanceof N_builtInFunction)
                return yield this.runBuiltInFunction(func.val, context);
            else if (func.val instanceof N_class)
                return yield this.runConstructor(func.val, context);
            else if (typeof func.val === 'function') {
                let args = [];
                for (let arg of this.arguments) {
                    let value = yield arg.interpret(context);
                    if (value.error)
                        return value.error;
                    args.push(value.val);
                }
                return yield func.val(...args);
            }
            else
                return new TypeError(this.startPos, this.endPos, 'function', typeof func.val);
        });
    }
    genContext(context, paramNames) {
        var _b;
        return __awaiter(this, void 0, void 0, function* () {
            const newContext = new Context();
            newContext.parent = context;
            let args = [];
            for (let i = 0; i < Math.max(paramNames.length, this.arguments.length); i++) {
                let value = None;
                if (this.arguments[i] !== undefined) {
                    let res = yield this.arguments[i].interpret(context);
                    if (res.error)
                        return res.error;
                    value = (_b = res.val) !== null && _b !== void 0 ? _b : None;
                }
                args.push(value);
                if (paramNames[i] !== undefined)
                    newContext.set(paramNames[i], value);
            }
            newContext.set('args', args);
            return newContext;
        });
    }
    runFunc(func, context) {
        var _b;
        return __awaiter(this, void 0, void 0, function* () {
            const newContext = yield this.genContext(context, func.arguments);
            if (newContext instanceof ESError)
                return newContext;
            let this_ = (_b = func.this_) !== null && _b !== void 0 ? _b : None;
            if (typeof this_ !== 'object')
                return new TypeError(this.startPos, this.endPos, 'object', typeof this_, this_, '\'this\' must be an object');
            newContext.set('this', this_);
            const res = yield func.body.interpret(newContext);
            if (res.funcReturn !== undefined) {
                res.val = res.funcReturn;
                res.funcReturn = undefined;
            }
            return res;
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
    runConstructor(constructor, context) {
        var _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const newContext = yield this.genContext(context, (_c = (_b = constructor === null || constructor === void 0 ? void 0 : constructor.init) === null || _b === void 0 ? void 0 : _b.arguments) !== null && _c !== void 0 ? _c : []);
            if (newContext instanceof ESError)
                return newContext;
            return yield constructor.genInstance(newContext);
        });
    }
}
export class N_function extends Node {
    constructor(startPos, endPos, body, argNames, name = '<anon func>', this_ = {}) {
        super(startPos, endPos);
        this.arguments = argNames;
        this.body = body;
        this.name = name;
        this.this_ = this_;
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
            const res = new interpretResult();
            if (this.value === undefined) {
                res.funcReturn = None;
                return res;
            }
            let val = yield this.value.interpret(context);
            if (val.error)
                return val.error;
            res.funcReturn = val.val;
            return res;
        });
    }
}
export class N_indexed extends Node {
    constructor(startPos, endPos, base, index) {
        super(startPos, endPos);
        this.base = base;
        this.index = index;
    }
    interpret_(context) {
        var _b;
        return __awaiter(this, void 0, void 0, function* () {
            let baseRes = yield this.base.interpret(context);
            if (baseRes.error)
                return baseRes;
            let indexRes = yield this.index.interpret(context);
            if (indexRes.error)
                return indexRes;
            const index = indexRes.val;
            const base = baseRes.val;
            if (!['string', 'number'].includes(typeof index))
                return new TypeError(this.startPos, this.endPos, 'string | number', typeof index, index, `With base ${base} and index ${index}`);
            if (typeof base !== 'object' && typeof base !== 'string')
                return new TypeError(this.startPos, this.endPos, 'object | array', typeof base);
            if (this.value) {
                let valRes = yield this.value.interpret(context);
                if (valRes.error)
                    return valRes;
                base[index] = (_b = valRes.val) !== null && _b !== void 0 ? _b : None;
            }
            return base[index];
        });
    }
}
export class N_class extends Node {
    constructor(startPos, endPos, methods, extends_, init, name = '<anon class>') {
        super(startPos, endPos);
        this.init = init;
        this.methods = methods;
        this.name = name;
        this.extends_ = extends_;
        this.instances = [];
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return this;
        });
    }
    genInstance(context, runInit = true, on = { constructor: this }) {
        return __awaiter(this, void 0, void 0, function* () {
            function dealWithExtends(context_, classNode, instance) {
                return __awaiter(this, void 0, void 0, function* () {
                    const constructor = instance.constructor;
                    const classNodeRes = yield classNode.interpret(context);
                    if (classNodeRes.error)
                        return classNodeRes.error;
                    if (!(classNodeRes.val instanceof N_class))
                        return new TypeError(classNode.startPos, classNode.endPos, 'N_class', typeof classNodeRes.val, classNodeRes.val);
                    const extendsClass = classNodeRes.val;
                    context_.symbolTable['super'] = () => __awaiter(this, void 0, void 0, function* () {
                        var _b, _c;
                        const newContext = new Context();
                        newContext.parent = context;
                        newContext.symbolTable['this'] = instance;
                        if (extendsClass.extends_ !== undefined) {
                            let _a = yield dealWithExtends(newContext, extendsClass.extends_, instance);
                            if (_a instanceof ESError)
                                return _a;
                        }
                        const res_ = yield ((_c = (_b = extendsClass === null || extendsClass === void 0 ? void 0 : extendsClass.init) === null || _b === void 0 ? void 0 : _b.body) === null || _c === void 0 ? void 0 : _c.interpret(newContext));
                        if (res_ && res_.error)
                            return res_;
                    });
                    instance = yield extendsClass.genInstance(context, false, instance);
                    if (instance instanceof ESError)
                        return instance;
                    // index access to prevent annoying wiggly red line
                    instance.constructor = constructor;
                    return instance;
                });
            }
            let instance = on;
            const newContext = new Context();
            newContext.parent = context;
            if (this.extends_ !== undefined) {
                let _a = yield dealWithExtends(newContext, this.extends_, instance);
                if (_a instanceof ESError)
                    return _a;
            }
            for (let method of this.methods) {
                // shallow clone of method with instance as this_
                instance[method.name] = new N_function(method.startPos, method.endPos, method.body, method.arguments, method.name, instance);
            }
            if (runInit) {
                newContext.symbolTable['this'] = instance;
                if (this.init) {
                    const res = yield this.init.body.interpret(newContext);
                    // return value of init is ignored
                    if (res.error)
                        return res.error;
                }
            }
            this.instances.push(instance);
            return instance;
        });
    }
}
export class N_fString extends Node {
    constructor(startPos, endPos, parts) {
        super(startPos, endPos);
        this.parts = parts;
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let out = '';
            for (let part of this.parts) {
                let res = yield part.interpret(context);
                if (res.error)
                    return res;
                // 1 to prevent '' around string
                out += str(res.val, 1);
            }
            return out;
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
    constructor(startPos = Position.unknown, endPos = Position.unknown) {
        super(startPos, endPos);
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return None;
        });
    }
}
export class N_break extends Node {
    constructor(startPos, endPos) {
        super(startPos, endPos);
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = new interpretResult();
            res.shouldBreak = true;
            return res;
        });
    }
}
export class N_continue extends Node {
    constructor(startPos, endPos) {
        super(startPos, endPos);
    }
    interpret_(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = new interpretResult();
            res.shouldContinue = true;
            return res;
        });
    }
}
