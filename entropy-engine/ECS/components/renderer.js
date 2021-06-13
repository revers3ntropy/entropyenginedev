import { JSONifyComponent } from '../../util/util.js';
import { Component } from '../component.js';
export class Renderer extends Component {
    constructor(type, is2D) {
        super(`Renderer`, type);
    }
    tick() { }
    json() {
        return JSONifyComponent(this);
    }
}
