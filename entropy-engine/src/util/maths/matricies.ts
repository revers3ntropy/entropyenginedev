import {v2} from './maths2D.js';
import {v3} from './maths3D.js';

export class Matrix {
    values: number[][];
    
    constructor(values: number[][]) {
        this.values = values;
    }
    
    get xSize () {
        return this.values[0].length;
    }
    get ySize () {
        return this.values.length;
    }
}