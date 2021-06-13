import { JSONifyComponent } from "../../util/util.js";
import { Component } from "../component.js";
import { Transform } from "../transform.js";
import { Renderer } from "./renderComponents.js";
import {TriangleV3, v2, v3, MeshV3} from '../../util/maths/maths.js';
import { Sprite } from "../sprite.js";

export abstract class Renderer3D extends Renderer {
    abstract draw (transform: Transform, camera: Sprite, ctx: any): void;
    
    protected constructor(type: string) {
        super(type, false);
    }

    tick () {}

    json () {
        return JSONifyComponent(this);
    }
}

export class MeshRenderer extends Renderer3D {
    tris: MeshV3;

    constructor ({
         tris = new MeshV3([]),
     }) {
        super("CircleRenderer2D");

        this.tris = tris;
    }

    draw (transform: Transform, camera: Sprite, ctx: any): void {
        
    }
}