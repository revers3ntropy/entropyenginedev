export class Context {
    constructor() {
        this.symbolTable = {};
    }
    get(identifier) {
        let value = this.symbolTable[identifier];
        if (!value && this.parent) {
            value = this.parent.get(identifier);
        }
        return value;
    }
    set(identifier, value) {
        this.symbolTable[identifier] = value;
    }
    remove(identifier) {
        delete this.symbolTable[identifier];
    }
}
export function interpret(rootNode) {
    const global = new Context();
    return rootNode.interpret(global);
}
