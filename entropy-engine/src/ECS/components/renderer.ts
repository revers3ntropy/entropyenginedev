import { JSONifyComponent } from '../../util/util.js';
import {Component} from '../component.js';

export abstract class Renderer extends Component {
    abstract draw (...args: any[]): any;

    protected constructor(type: string, is2D: boolean) {
        super(`Renderer`, type);
    }

    tick () {}

    json () {
        return JSONifyComponent(this);
    }
}
