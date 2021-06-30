export class ESError {
    constructor(startPos, endPos, name, details) {
        this.startPos = startPos;
        this.endPos = endPos;
        this.name = name;
        this.details = details;
    }
    get str() {
        return `${this.name} Error: ${this.details} \n at ${this.startPos.str} to ${this.endPos.str}`;
    }
}
export class IllegalCharError extends ESError {
    constructor(startPos, endPos, char) {
        super(startPos, endPos, 'Illegal Character', `'${char}'`);
    }
}
export class InvalidSyntaxError extends ESError {
    constructor(startPos, endPos, details) {
        super(startPos, endPos, 'Syntax', details);
    }
}
