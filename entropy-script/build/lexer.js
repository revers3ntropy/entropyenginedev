import { Position } from "./position.js";
import { digits, identifierChars, KEYWORDS, singleCharTokens, singleLineComment, stringSurrounds, tt } from "./constants.js";
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
    generate() {
        if (!this.text)
            return [[new Token(this.position, this.position, tt.EOF)], undefined];
        const tokens = [];
        const charStarts = {
            '=': () => this.charEquals(),
            '!': () => this.charExclamationMark(),
            '>': () => this.charGreaterThan(),
            '<': () => this.charLessThan(),
        };
        while (this.currentChar !== undefined) {
            // add semi-colon after
            if (' \t\n'.includes(this.currentChar)) {
                this.advance();
            }
            else if (digits.includes(this.currentChar)) {
                tokens.push(this.makeNumber());
            }
            else if (this.currentChar === singleLineComment[0] &&
                this.text[this.position.idx + 1] === singleLineComment[1]) {
                this.comment();
            }
            else if (singleCharTokens.hasOwnProperty(this.currentChar)) {
                let startPos = this.position.clone;
                let val = singleCharTokens[this.currentChar];
                this.advance();
                tokens.push(new Token(startPos, this.position, val));
            }
            else if (identifierChars.includes(this.currentChar)) {
                tokens.push(this.makeIdentifier());
            }
            else if (charStarts.hasOwnProperty(this.currentChar)) {
                tokens.push(charStarts[this.currentChar]());
            }
            else if (stringSurrounds.includes(this.currentChar)) {
                tokens.push(this.makeString());
            }
            else {
                // unknown char
                let startPos = this.position.clone;
                let char = this.currentChar;
                this.advance();
                return [[], new IllegalCharError(startPos, this.position, char)];
            }
        }
        tokens.push(new Token(this.position, this.position, tt.EOF));
        return [tokens, undefined];
    }
    makeNumber() {
        const startPos = this.position.clone;
        let numStr = '';
        let dotCount = 0;
        while (this.currentChar !== undefined && (digits + '._').includes(this.currentChar)) {
            if (this.currentChar === '.') {
                if (dotCount === 1)
                    break;
                dotCount++;
                numStr += '.';
                // use _ as a deliminator for sets of 0s - eg 1_000_000_000
            }
            else if (this.currentChar !== '_') {
                numStr += this.currentChar;
            }
            this.advance();
        }
        return new Token(startPos, this.position.clone, tt.NUMBER, parseFloat(numStr));
    }
    makeString() {
        const startPos = this.position.clone;
        let str = '';
        let strClose = this.currentChar;
        this.advance();
        while (this.currentChar !== strClose && this.currentChar !== undefined) {
            if (this.currentChar === '\\') {
                // skip over the character so that you can include the strClose string in the string
                this.advance();
            }
            str += this.currentChar;
            this.advance();
        }
        this.advance();
        return new Token(startPos, this.position.clone, tt.STRING, str);
    }
    makeIdentifier() {
        let idStr = '';
        const posStart = this.position.clone;
        while (this.currentChar !== undefined && (identifierChars + digits).includes(this.currentChar)) {
            idStr += this.currentChar;
            this.advance();
        }
        let tokType = tt.IDENTIFIER;
        if (KEYWORDS.includes(idStr))
            tokType = tt.KEYWORD;
        return new Token(posStart, this.position, tokType, idStr);
    }
    charEquals() {
        let startPos = this.position.clone;
        this.advance();
        let tokType = tt.ASSIGN;
        if (this.currentChar === '=') {
            tokType = tt.EQUALS;
            this.advance();
        }
        return new Token(startPos, this.position, tokType);
    }
    charExclamationMark() {
        let startPos = this.position.clone;
        this.advance();
        let tokType = tt.NOT;
        if (this.currentChar === '=') {
            tokType = tt.NOTEQUALS;
            this.advance();
        }
        return new Token(startPos, this.position, tokType);
    }
    charGreaterThan() {
        let startPos = this.position.clone;
        this.advance();
        let tokType = tt.GT;
        if (this.currentChar === '=') {
            tokType = tt.GTE;
            this.advance();
        }
        return new Token(startPos, this.position, tokType);
    }
    charLessThan() {
        let startPos = this.position.clone;
        this.advance();
        let tokType = tt.LT;
        if (this.currentChar === '=') {
            tokType = tt.LTE;
            this.advance();
        }
        return new Token(startPos, this.position, tokType);
    }
    comment() {
        this.advance();
        while (this.currentChar !== '\n' && this.currentChar !== undefined)
            this.advance();
        this.advance();
    }
}
