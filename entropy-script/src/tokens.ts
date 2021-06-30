import {Position} from "./position.js";
import {tokenType} from "./constants.js";

export class Token {
    type: tokenType;
    value: any;
    startPos: Position;
    endPos: Position;

    constructor (startPos: Position, endPos: Position, type: tokenType, value: any = undefined) {
        this.type = type;
        this.value = value;
        this.startPos = startPos;
        this.endPos = endPos;
    }

    public matches(type: tokenType, val: any) {
        return this.type === type && this.value === val;
    }
}