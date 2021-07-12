export class Token {
    constructor(startPos, endPos, type, value = undefined) {
        this.type = type;
        this.value = value;
        this.startPos = startPos;
        this.endPos = endPos;
    }
    matches(type, val) {
        return this.type === type && this.value === val;
    }
}
