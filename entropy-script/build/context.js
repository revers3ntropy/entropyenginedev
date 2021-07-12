import { initialise } from "./init.js";
export class Context {
    constructor() {
        this.initialisedAsGlobal = false;
        this.symbolTable = {};
    }
    has(identifier) {
        return this.get(identifier) !== undefined;
    }
    hasOwn(identifier) {
        return this.symbolTable[identifier] !== undefined;
    }
    get(identifier) {
        let value = this.symbolTable[identifier];
        if (value === undefined && this.parent)
            value = this.parent.get(identifier);
        return value;
    }
    set(identifier, value, globally = false) {
        let context = this;
        if (globally) {
            context = this.root;
        }
        else {
            // searches upwards to find the identifier, and if none can be found then it assigns it to the current context
            while (!context.hasOwn(identifier) && context.parent !== undefined) {
                context = context.parent;
            }
            if (!context.hasOwn(identifier))
                context = this;
        }
        context.symbolTable[identifier] = value;
    }
    remove(identifier) {
        delete this.symbolTable[identifier];
    }
    delete() {
        for (let symbol in this.symbolTable) {
            this.remove(symbol);
        }
        delete this.symbolTable;
        this.parent = undefined;
    }
    get root() {
        let parent = this;
        while (parent.parent)
            parent = parent.parent;
        return parent;
    }
    resetAsGlobal() {
        if (!this.initialisedAsGlobal)
            return;
        const printFunc = this.get('print').func;
        this.symbolTable = {};
        this.initialisedAsGlobal = false;
        initialise(this, printFunc);
    }
}
