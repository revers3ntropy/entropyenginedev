import { v2 } from "./maths.js";
import { Sprite } from "./sprite.js";
import { expandV2 } from "./util.js";
export class Component {
    constructor(type, subtype = "") {
        this.type = type;
        this.subtype = subtype;
        this.hasSubType = !(subtype === "");
    }
}
export class Transform extends Component {
    constructor({ position = new v2(0, 0), scale = new v2(1, 1), rotation = 0, _position = new v2(0, 0), _scale = new v2(1, 1), _rotation = 0, parent = undefined }) {
        super('Transform');
        this._position = position || _position;
        this._scale = scale !== null && scale !== void 0 ? scale : scale;
        this._rotation = rotation || rotation;
        this.parent = parent;
    }
    json() {
        var _a, _b, _c;
        return {
            'type': 'Transform',
            'position': expandV2(this._position),
            'scale': expandV2(this._scale),
            'rotation': this._rotation,
            'parent': (_c = (_b = (_a = this.parent) === null || _a === void 0 ? void 0 : _a.sprite) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : ''
        };
    }
    tick() { }
    get rotation() {
        if (this.parent !== undefined)
            return this._rotation + this.parent.rotation;
        return this._rotation;
    }
    get localRotation() {
        return this._rotation;
    }
    set localRotation(rad) {
        this.rotation = rad;
    }
    set rotation(rad) {
        this._rotation = rad || 0;
    }
    get position() {
        if (this.parent !== undefined)
            return this._position.clone.add(this.parent.position);
        return this._position;
    }
    get localPosition() {
        return this._position;
    }
    set localPosition(v) {
        this.position = v;
    }
    set position(v) {
        var _a, _b;
        var _c, _d;
        this._position = v || v2.zero;
        (_a = (_c = this._position).x) !== null && _a !== void 0 ? _a : (_c.x = 0);
        (_b = (_d = this._position).y) !== null && _b !== void 0 ? _b : (_d.y = 0);
    }
    get scale() {
        if (this.parent !== undefined)
            return this._scale.clone.add(this.parent.scale);
        return this._scale;
    }
    get localScale() {
        return this._scale;
    }
    set localScale(v) {
        this.scale = v;
    }
    set scale(v) {
        var _a, _b;
        var _c, _d;
        this._scale = v || v2.zero;
        (_a = (_c = this._scale).x) !== null && _a !== void 0 ? _a : (_c.x = 0);
        (_b = (_d = this._scale).y) !== null && _b !== void 0 ? _b : (_d.y = 0);
    }
    detachParent() {
        this.parent = undefined;
    }
    getChildren() {
        let children = [];
        for (let sprite of Sprite.sprites)
            if (Object.is(sprite.transform.parent, this))
                children.push(sprite);
        return children;
    }
    getChildCount() {
        let count = 0;
        for (let sprite of Sprite.sprites)
            if (Object.is(sprite.transform.parent, this))
                count++;
        return count;
    }
    detachChildren() {
        for (let child of this.getChildren())
            child.transform.parent = undefined;
    }
    makeChildOf(t) {
        this.parent = t;
    }
    makeParentOf(transforms) {
        for (const transform of transforms)
            transform.parent = this;
    }
    isRoot() {
        return this.parent == undefined;
    }
    isChild() {
        return this.parent != undefined;
    }
    get sprite() {
        return Sprite.sprites.find(sprite => Object.is(sprite.transform, this));
    }
    get root() {
        function findNextRoot(t) {
            if (t.parent === undefined)
                return t;
            return findNextRoot(t.parent);
        }
        return findNextRoot(this);
    }
    get forwards() {
        return new v2(Math.sin(this.rotation), Math.cos(this.rotation));
    }
    get right() {
        let forwards = this.forwards;
        return new v2(forwards.y, -forwards.x);
    }
    getChild(name) {
        return this.getChildren().find(t => t.name === name);
    }
}
