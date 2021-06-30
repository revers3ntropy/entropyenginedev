export class Token {
    constructor(startPos, endPos, type, value = undefined) {
        this.type = type;
        this.value = value;
        this.startPos = startPos;
        this.endPos = endPos;
    }
}
