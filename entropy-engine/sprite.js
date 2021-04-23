var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Transform } from './component.js';
import { v2 } from "./maths.js";
import { Body, PhysicsMaterial } from "./physics.js";
import { CircleCollider } from "./collisions.js";
import { CircleRenderer } from "./renderComponents.js";
// all components
import { RectCollider } from './collisions.js';
import { ImageRenderer, RectRenderer } from './renderComponents.js';
import { GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox } from './gui.js';
import { Camera } from './camera.js';
import { Script } from "./scripts.js";
import { getSpriteFromJSON } from "./JSONprocessor.js";
// reference everything so the ts compiler will think that it is being used and wont delete the import
CircleCollider;
RectCollider;
Body;
PhysicsMaterial;
CircleRenderer;
RectRenderer;
ImageRenderer;
GUIBox;
GUIText;
GUITextBox;
GUIRect;
GUICircle;
GUIPolygon;
GUIImage;
Camera;
Script;
export class Sprite {
    constructor(config) {
        var _a, _b, _c, _d, _e;
        this.tag = (_a = config.tag) !== null && _a !== void 0 ? _a : 'sprite';
        this.name = (_b = config.name) !== null && _b !== void 0 ? _b : 'new sprite';
        this.components = (_c = config.components) !== null && _c !== void 0 ? _c : [];
        this.transform = (_d = config.transform) !== null && _d !== void 0 ? _d : new Transform({});
        this.Static = (_e = config.Static) !== null && _e !== void 0 ? _e : false;
        this.id = this.generateID();
    }
    generateID() {
        let id = 0;
        let idsInUse = Sprite.sprites.map(sprite => sprite.id);
        function getID() {
            return Math.floor(Math.random() * Math.pow(10, 5));
        }
        while (idsInUse.indexOf(id) > -1)
            id = getID();
        return id;
    }
    tick() {
        for (let component of this.components)
            component.tick(this.transform);
    }
    addComponent(component) {
        this.components.push(component);
    }
    hasComponent(type, subType = '') {
        for (let c of this.components)
            if ((c.type === type &&
                (c.subtype === subType || subType === '')) || c.subtype === type)
                return true;
        return false;
    }
    getComponent(type, subType = '') {
        // returns the first component of passed type
        const component = this.components.find(c => (c.type === type &&
            (c.subtype === subType || subType === '')) || c.subtype === type);
        if (component === undefined)
            throw new Error(`Cannot find component of type ${type} on sprite ${this.name}`);
        return component;
    }
    getComponents(type, subType = '') {
        // returns all components of that type
        let components = [];
        for (const component of this.components)
            if (component.type === type &&
                (component.subtype === subType || subType === ''))
                components.push(component);
        return components;
    }
    delete() {
        for (let i = 0; i < Sprite.sprites.length; i++) {
            const sprite = Sprite.sprites[i];
            if (!Object.is(sprite, this))
                continue;
            delete Sprite.sprites[i];
            Sprite.sprites.splice(i, 1);
        }
    }
    getClone() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const [sprite, parent] = yield getSpriteFromJSON(this.json());
            sprite.transform.parent = ((_a = Sprite.find(parent)) === null || _a === void 0 ? void 0 : _a.transform) || undefined;
            return sprite;
        });
    }
    json() {
        /*
            Parts to the sprite:

                ✅ name: string - easy
                ✅ components: Component[] - very hard, lots of cases, scripting - each component has its own json method
                ✅ id: number - easy, just generate new id
                ✅ tag: string - easy
                ✅ transform: Transform - medium - need to make sure it has the same parent transform, but everything else is cloned
                            v2s are relatively hard, need to expand them into an array
                        position
                        scale
                        rotation
                        parent - string not object

                ✅ Static: boolean - easy
         */
        return {
            'name': this.name,
            'tag': this.tag,
            'Static': this.Static,
            'transform': this.transform.json(),
            'components': this.components.map(c => c.json())
        };
    }
    static newSprite(setup) {
        const newSprite = new Sprite(setup);
        Sprite.sprites.push(newSprite);
        return newSprite;
    }
    static fill({ position = new v2(0, 0), dimensions = new v2(10, 10), particleRadius = 5, material = new PhysicsMaterial({}), gravityAttract = v2.zero, gravityEffect = 0, name = 'fluid', colour = `rgb(0, 0, 0)`, Static = false }) {
        /*
            fills a rectangle with lots of balls, to create a kind of fluid. Not an efficient or good fluid simulator,
            just to allow the easy creation of lots of similar sprites.
         */
        let fluid = [];
        const r = particleRadius;
        particleRadius++;
        for (let y = position.y + particleRadius; y <= position.y + dimensions.y - particleRadius; y += particleRadius * 2) {
            for (let x = position.x + particleRadius; x <= position.x + dimensions.x - particleRadius; x += particleRadius * 2) {
                fluid.push(Sprite.newSprite({
                    name: `${name} ${x} ${y}`,
                    components: [
                        new Body({
                            gravityAttract,
                            gravityEffect,
                            material
                        }),
                        new CircleCollider({}),
                        new CircleRenderer({ colour })
                    ],
                    transform: new Transform({
                        scale: new v2(r, r * Math.PI),
                        position: new v2(x, y)
                    }),
                    tag: name,
                    Static: Static
                }));
            }
        }
        return fluid;
    }
    static find(name = "") {
        const sprite = Sprite.sprites.find((sprite) => {
            return sprite.name === name;
        });
        if (!sprite)
            return undefined;
        return sprite;
    }
    static findWithTag(tag) {
        let sprites = [];
        Sprite.loopThroughSprites((sprite) => {
            if (sprite.tag === tag)
                sprites.push(sprite);
        });
        return sprites;
    }
    static loopThroughSprites(handler) {
        for (const sprite of Sprite.sprites)
            handler(sprite);
    }
}
// -------------- static stuff ------------
Sprite.sprites = [];
