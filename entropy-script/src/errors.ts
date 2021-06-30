import {Position} from "./position.js";

export class ESError {
    name: string;
    details: string;
    startPos: Position;
    endPos: Position;

    constructor (startPos: Position, endPos: Position, name: string, details: string) {
        this.startPos = startPos;
        this.endPos = endPos;
        this.name = name;
        this.details = details;
    }

    get str () {
        return `${this.name} Error: ${this.details} \n at ${this.startPos.str} to ${this.endPos.str}`;
    }
}

export class IllegalCharError extends ESError {
    constructor(startPos: Position, endPos: Position, char: string) {
        super(startPos, endPos, 'Illegal Character', `'${char}'`);
    }
}

export class InvalidSyntaxError extends ESError {
    constructor(startPos: Position, endPos: Position, details: string) {
        super(startPos, endPos, 'Syntax', details);
    }
}