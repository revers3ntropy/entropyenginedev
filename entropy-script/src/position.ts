export class Position {
    idx: number;
    ln: number;
    col: number;

    constructor (idx: number, ln: number, col: number) {
        this.idx = idx;
        this.ln = ln;
        this.col = col;
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
        return new Position(this.idx, this.ln, this.col);
    }

    get str () {
        return `${this.ln}:${this.col}`;
    }

    static get unknown () {
        return new Position(-1, -1, -1);
    }
}