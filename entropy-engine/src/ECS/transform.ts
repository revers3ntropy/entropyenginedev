import {v2, v3 } from "../util/maths/maths.js";
import { Component } from "./component.js";
import { Scene } from "./scene.js";
import { Sprite } from "./sprite.js";

export class Transform extends Component {
    private _position: v3;
    private _rotation: v3;
    private _scale: v3;

    // @ts-ignore
    position: v3;
    // @ts-ignore
    scale: v3;
    // @ts-ignore
    rotation: v3;

    // @ts-ignore
    parent: Transform | number;

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
            type: 'v3',
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
            type: 'v3',
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

        this.addPublic({
            name: 'parent',
            value: parent,
            type: 'Transform'
        });
    }

    setParentDirty (val: Transform | number) {
        /*
            For if the parent is not known to be safe, for example from user input.
            Protects against types and circular parenting
         */
        if (!(val instanceof Transform) && typeof val !== 'number') {
            this.parent = Scene.active;
            return;
        }

        if (typeof val === "number") {
            this.parent = val;
            return;
        }

        // check for circular parenting
        if (this.recursiveChildren.includes(val.sprite)) {
            for (const child of this.children)
                // shift children up one level if any of the
                // children are becoming the parent of this sprite
                child.transform.parent = this.parent;
        }

        this.parent = val;
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
            position: this._position.array,
            scale: this._scale.array,
            rotation: this._rotation.array,
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

    detachFromParent (): void {
        this.parent = Scene.active;
    }

    get children (): Sprite[] {
        let children = [];

        for (let sprite of Sprite.sprites)
            if (Object.is(sprite.transform.parent, this))
                children.push(sprite);

        return children;
    }

    get recursiveChildren (): Sprite[] {
        const queue: Sprite[] = this.children;
        const children: Sprite[] = [];

        while (queue.length > 0) {
            for (let child of queue[0].transform.children) {
                queue.push(child);
            }

            // there must be an element so shift can't return undefined, but ts doesn't kow that
            children.push( <Sprite> queue.shift());
        }

        return children;
    }

    get childCount (): number {
        let count = 0;

        for (let sprite of Sprite.sprites)
            if (Object.is(sprite.transform.parent, this))
                count++;

        return count;
    }

    detachChildren (): void {
        for (let child of this.children)
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
        return this.children.find(t => t.name === name);
    }
}