export class Context {
    symbolTable: any;
    parent: Context | undefined;
    constructor () {
        this.symbolTable = {};
    }

    has (identifier: string) {
        return this.get(identifier) === undefined;
    }

    hasOwn (identifier: string) {
        return this.symbolTable[identifier] === undefined;
    }

    get (identifier: string) {
        let value = this.symbolTable[identifier];
        if (value === undefined && this.parent)
            value = this.parent.get(identifier);

        return value;
    }

    set (identifier: string, value: any) {
        this.symbolTable[identifier] = value;
    }

    remove (identifier: string) {
        delete this.symbolTable[identifier];
    }

    delete () {
        for (let symbol in this.symbolTable) {
            this.remove(symbol);
        }

        delete this.symbolTable;
        this.parent = undefined;
    }
}