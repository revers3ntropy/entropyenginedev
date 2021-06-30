import { Position } from "./position.js";
import { digits, tokenType } from "./constants.js";
import { IllegalCharError } from "./errors.js";
import { Token } from "./tokens.js";
export class Lexer {
    constructor(program) {
        this.text = program;
        this.position = new Position(-1, 0, -1);
        this.advance();
    }
    advance() {
        this.position.advance(this.currentChar);
        this.currentChar = this.text[this.position.idx];
    }
    makeNumber() {
        const startPos = this.position.clone;
        let numStr = '';
        let dotCount = 0;
        while (this.currentChar !== undefined && (digits + '.').includes(this.currentChar)) {
            if (this.currentChar === '.') {
                if (dotCount === 1)
                    break;
                dotCount++;
                numStr += '.';
            }
            else {
                numStr += this.currentChar;
            }
            this.advance();
        }
        return new Token(startPos, this.position.clone, tokenType.NUMBER, parseFloat(numStr));
    }
    generate() {
        const tokens = [];
        const singleCharTokens = {
            '*': tokenType.MUL,
            '/': tokenType.DIV,
            '+': tokenType.ADD,
            '-': tokenType.SUB,
            '(': tokenType.LPAREN,
            ')': tokenType.RPAREN,
        };
        while (this.currentChar !== undefined) {
            if (' \t'.includes(this.currentChar)) {
                this.advance();
            }
            else if (digits.includes(this.currentChar)) {
                tokens.push(this.makeNumber());
            }
            else if (singleCharTokens.hasOwnProperty(this.currentChar)) {
                let startPos = this.position.clone;
                let val = singleCharTokens[this.currentChar];
                this.advance();
                tokens.push(new Token(startPos, this.position, val));
            }
            else {
                // unknown char
                let startPos = this.position.clone;
                let char = this.currentChar;
                this.advance();
                return [[], new IllegalCharError(startPos, this.position, char)];
            }
        }
        tokens.push(new Token(this.position, this.position, tokenType.EOF));
        return [tokens, undefined];
    }
}
