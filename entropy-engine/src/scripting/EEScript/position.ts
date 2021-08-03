export class Position {
    idx: number;
    ln: number;
    col: number;
    file: string;

    constructor (idx: number, ln: number, col: number, file: string = '__main__') {
        this.idx = idx;
        this.ln = ln;
        this.col = col;
        this.file = file;
    }

    advance (currentChar= '') {
        this.idx++;
        this.col++;

        if (currentChar === '\n') {
            this.ln++;
            this.col = 0;
        }

        return this;
    }

    get clone () {
        return new Position(this.idx, this.ln, this.col, this.file);
    }

    get str () {
        return `${this.file}.es ${this.ln+1}:${this.col+1}`;
    }

    static get unknown () {
        return new Position(-1, -1, -1, '__unknown__');
    }
}