import {v3} from "../../entropy-engine/src/maths/v3";

export const digits = '0123456789';

export enum tokenType {
    NUMBER,
    ADD,
    SUB,
    MUL,
    DIV,
    LPAREN,
    RPAREN,
    EOF
}

export type enumDict<T extends string | symbol | number, U> = {
    [K in T]: U
}

export const tokenTypeString: enumDict<tokenType, string> = {
    [tokenType.NUMBER]: 'Number',
    [tokenType.ADD]: '+',
    [tokenType.SUB]: '-',
    [tokenType.MUL]: '*',
    [tokenType.DIV]: '/',
    [tokenType.LPAREN]: '(',
    [tokenType.RPAREN]: ')',
    [tokenType.EOF]: 'End of File',

}

export const notFoundVariable = undefined;