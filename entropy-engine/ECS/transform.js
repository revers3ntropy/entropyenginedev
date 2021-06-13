import { v2, v3 } from "../util/maths/maths.js";
import { expandV3 } from "../util/util.js";
import { Component } from "./component.js";
import { Scene } from "./scene.js";
import { Sprite } from "./sprite.js";
export class Transform extends Component {
    constructor({ position = v3.zero, scale = new v3(1, 1, 1), rotation = v3.zero, _position = v3.zero, _scale = new v3(1, 1, 1), _rotation = v3.zero, parent = Scene.active }) {
        super('Transform');
        // doesn't need to use public as transforms are delt with seperately in the editor
        this._position = position || _position;
        this._scale = scale !== null && scale !== void 0 ? scale : scale;
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
            overrideSet: (v) => {
                var _a, _b;
                var _c, _d;
                this._position = v || v3.zero;
                (_a = (_c = this._position).x) !== null && _a !== void 0 ? _a : (_c.x = 0);
                (_b = (_d = this._position).y) !== null && _b !== void 0 ? _b : (_d.y = 0);
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
            overrideSet: (value) => {
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
            overrideSet: (v) => {
                var _a, _b;
                var _c, _d;
                this._scale = v || v3.zero;
                (_a = (_c = this._scale).x) !== null && _a !== void 0 ? _a : (_c.x = 0);
                (_b = (_d = this._scale).y) !== null && _b !== void 0 ? _b : (_d.y = 0);
            }
        });
    }
    json() {
        let parent = {
            type: '',
            name: ''
        };
        if (this.parent instanceof Transform) {
            parent.type = 'Transform';
            parent.name = this.parent.sprite.name;
        }
        else {
            parent.type = 'Scene';
            parent.name = this.parent.toString();
        }
        return {
            type: 'Transform',
            position: expandV3(this._position),
            scale: expandV3(this._scale),
            rotation: this._rotation,
            parent
        };
    }
    tick() { }
    get localRotation() {
        return this._rotation;
    }
    set localRotation(v) {
        this.rotation = v;
    }
    get localPosition() {
        return this._position;
    }
    set localPosition(v) {
        this.position = v;
    }
    get localScale() {
        return this._scale;
    }
    set localScale(v) {
        this.scale = v;
    }
    detachParent() {
        this.parent = Scene.active;
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
            child.transform.parent = Scene.active;
    }
    makeChildOf(t) {
        this.parent = t;
    }
    makeParentOf(transforms) {
        for (const transform of transforms)
            transform.parent = this;
    }
    isRoot() {
        return typeof this.parent === 'number';
    }
    isChild() {
        return this.parent instanceof Transform;
    }
    get sprite() {
        return Sprite.sprites.find(sprite => Object.is(sprite.transform, this));
    }
    get root() {
        function findNextRoot(t) {
            if (typeof t.parent === 'number')
                return t;
            return findNextRoot(t.parent);
        }
        return findNextRoot(this);
    }
    get forwards() {
        return this.rotation;
    }
    get right() {
        let forwards = this.forwards;
        return new v2(forwards.y, -forwards.x);
    }
    getChild(name) {
        return this.getChildren().find(t => t.name === name);
    }
}
