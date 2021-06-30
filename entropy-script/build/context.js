export class Context {
    constructor() {
        this.symbolTable = {};
    }
    has(identifier) {
        return this.get(identifier) === undefined;
    }
    hasOwn(identifier) {
        return this.symbolTable[identifier] === undefined;
    }
    get(identifier) {
        let value = this.symbolTable[identifier];
        if (value === undefined && this.parent)
            value = this.parent.get(identifier);
        return value;
    }
    set(identifier, value) {
        this.symbolTable[identifier] = value;
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
}
