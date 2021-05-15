import { v2 } from "./maths.js";
import {Sprite} from "./sprite.js";
import {expandV2} from "./util.js";

export abstract class Component {
    public type: string;
    /*
        subtype so you can have three-level inheritance for components, e.g. Component ==> Renderer ==> RectRenderer
        subtype is RectRenderer, type is Renderer
        as sprites can only have a single of each type, can use 'getComponent(type)' without worrying about what type of that it is
        e.g. sprite.getComponent('Renderer').draw()
        instead of dealing with every possible renderer
     */
    public subtype: string;
    // not really used...
    public hasSubType: boolean;

    protected constructor(type: string, subtype = "") {
        this.type = type;
        this.subtype = subtype;
        this.hasSubType = !(subtype === "");
    }

    abstract tick (transform: Transform): void;

    // returns what is required to build it from the JSON processor
    // used especially for building the game as a html file
    abstract json (): any;
}

export class Transform extends Component {
    private _position: v2;
    private _rotation: number;
    private _scale: v2;
    parent: Transform | undefined;

    constructor({
        position = new v2(0, 0),
        scale = new v2(1, 1),
        rotation = 0,

        _position = new v2(0, 0),
        _scale = new v2(1, 1),
        _rotation = 0,

        parent = undefined
    }) {
        super('Transform');
        this._position = position || _position;
        this._scale = scale ?? scale;
        this._rotation = rotation || rotation;
        this.parent = parent;
    }

    json () {
        return {
            'type': 'Transform',
            'position': expandV2(this._position),
            'scale': expandV2(this._scale),
            'rotation': this._rotation,
            'parent': this.parent?.sprite?.name ?? ''
        }
    }

    tick(): void {}

    get rotation () {
        if (this.parent !== undefined)
            return this._rotation + this.parent.rotation;

        return this._rotation;
    }

    get localRotation () {
        return this._rotation;
    }

    set localRotation (rad: number) {
        this.rotation = rad;
    }

    set rotation (rad: number) {
        this._rotation = rad || 0;
    }

    get position () {
        if (this.parent !== undefined)
            return this._position.clone.add(this.parent.position);

        return this._position;
    }

    get localPosition () {
        return this._position;
    }

    set localPosition (v: v2) {
        this.position = v;
    }

    set position (v: v2) {
        this._position = v || v2.zero;
        this._position.x ??= 0;
        this._position.y ??= 0;
    }

    get scale () {
        if (this.parent !== undefined)
            return this._scale.clone.add(this.parent.scale);

        return this._scale;
    }

    get localScale () {
        return this._scale
    }

    set localScale (v: v2) {
        this.scale = v;
    }

    set scale (v: v2) {
        this._scale = v || v2.zero;
        this._scale.x ??= 0;
        this._scale.y ??= 0;
    }

    detachParent (): void {
        this.parent = undefined;
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
            child.transform.parent = undefined;
    }

    makeChildOf (t: Transform): void {
        this.parent = t;
    }

    makeParentOf (transforms: Transform[]): void {
        for (const transform of transforms)
            transform.parent = this;
    }

    isRoot (): boolean {
        return this.parent == undefined;
    }

    isChild (): boolean {
        return this.parent != undefined;
    }

    get sprite (): Sprite {
        return Sprite.sprites.find(sprite => Object.is(sprite.transform, this)) as Sprite;
    }

    get root (): Transform {
        function findNextRoot (t: Transform): Transform {
            if (t.parent === undefined)
                return t;

            return findNextRoot(t.parent);
        }

        return findNextRoot(this);
    }

    get forwards (): v2 {
        return new v2(
            Math.sin(this.rotation),
            Math.cos(this.rotation)
        )
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