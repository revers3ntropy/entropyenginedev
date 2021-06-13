import {v2, v3 } from "../util/maths/maths.js";
import { expandV3 } from "../util/util.js";
import { Component } from "./component.js";
import { Scene } from "./scene.js";
import { Sprite } from "./sprite.js";

export class Transform extends Component {
    private _position: v3;
    private _rotation: v3;
    private _scale: v3;
    parent: Transform | number;
    
    // @ts-ignore
    position: v3;
    // @ts-ignore
    scale: v3;
    // @ts-ignore
    rotation: v3;

    constructor({
        position = v3.zero,
        scale = new v3(1, 1, 1),
        rotation = v3.zero,

        _position = v3.zero,
        _scale = new v3(1, 1, 1),
        _rotation = v3.zero,

        parent = Scene.active
    }) {
        super('Transform');
        // doesn't need to use public as transforms are delt with seperately in the editor
        this._position = position || _position;
        this._scale = scale ?? scale;
        this._rotation = rotation || rotation;
        this.parent = parent;

        this.addPublic({
            name: 'position',
            value: this._position,
            type: 'v3',
            overrideGet: () => {
                if (typeof this.parent === 'number') 
                    return this._position;
                
                return this._position.clone.add(this.parent.position);
            },
            overrideSet: (v: v3) => {
                this._position = v || v3.zero;
                this._position.x ??= 0;
                this._position.y ??= 0;
            }
        });

        this.addPublic({
            name: 'rotation',
            value: this._rotation,
            overrideGet: () => {
                if (typeof this.parent === 'number')
                    return this._rotation;
                
                return this._rotation.clone.add(this.parent.rotation);
            },
            overrideSet: (value: v3) => {
                this._rotation = value || v3.zero;
            }
        });

        this.addPublic({
            name: 'scale',
            value: this._scale,
            overrideGet: () => {
                if (typeof this.parent === 'number')
                    return this._scale;
                
                return this._scale.clone.mul(this.parent.scale);
            },
            overrideSet: (v: v3) => {
                this._scale = v || v3.zero;
                this._scale.x ??= 0;
                this._scale.y ??= 0;
            }
        });
    }

    json () {
        let parent = {
            type: '',
            name: ''
        };
        if (this.parent instanceof Transform) {
            parent.type = 'Transform';
            parent.name = this.parent.sprite.name;
        } else {
            parent.type = 'Scene';
            parent.name = this.parent.toString();
        }
        
        return {
            type: 'Transform',
            position: expandV3(this._position),
            scale: expandV3(this._scale),
            rotation: this._rotation,
            parent
        }
    }

    tick() {}
    

    get localRotation () {
        return this._rotation;
    }

    set localRotation (v: v3) {
        this.rotation = v;
    }

    get localPosition () {
        return this._position;
    }

    set localPosition (v: v3) {
        this.position = v;
    }

    get localScale () {
        return this._scale
    }

    set localScale (v: v3) {
        this.scale = v;
    }

    detachParent (): void {
        this.parent = Scene.active;
    }

    getChildren (): Sprite[] {
        let children = [];

        for (let sprite of Sprite.sprites)
            if (Object.is(sprite.transform.parent, this))
                children.push(sprite);

        return children;
    }

    getChildCount (): number {
        let count = 0;

        for (let sprite of Sprite.sprites)
            if (Object.is(sprite.transform.parent, this))
                count++;

        return count;
    }

    detachChildren (): void {
        for (let child of this.getChildren())
            child.transform.parent = Scene.active;
    }

    makeChildOf (t: Transform | number): void {
        this.parent = t;
    }

    makeParentOf (transforms: Transform[]): void {
        for (const transform of transforms)
            transform.parent = this;
    }

    isRoot (): boolean {
        return typeof this.parent === 'number';
    }

    isChild (): boolean {
        return this.parent instanceof Transform;
    }

    get sprite (): Sprite {
        return Sprite.sprites.find(sprite => Object.is(sprite.transform, this)) as Sprite;
    }

    get root (): Transform {
        function findNextRoot (t: Transform): Transform {
            if (typeof t.parent === 'number')
                return t;

            return findNextRoot(t.parent);
        }

        return findNextRoot(this);
    }

    get forwards (): v3 {
        return this.rotation;
    }

    get right (): v2 {
        let forwards = this.forwards;
        return new v2(
            forwards.y,
            -forwards.x
        )
    }

    getChild (name: string) {
        return this.getChildren().find(t => t.name === name);
    }
}