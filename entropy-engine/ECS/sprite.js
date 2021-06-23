var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Body } from "./components/body.js";
import { CircleRenderer } from "./components/renderComponents.js";
// all components
import { RectCollider, CircleCollider } from '../ECS/components/colliders.js';
import { ImageRenderer2D, RectRenderer } from './components/renderComponents.js';
import { GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox } from './components/gui.js';
import { Camera } from './components/camera.js';
import { Script } from "./components/scriptComponent.js";
import { getSpriteFromJSON, setParentFromInfo } from "../util/JSONprocessor.js";
import { Transform } from './transform.js';
import { Scene } from './scene.js';
// reference everything so the ts compiler will think that it is being used and wont delete the import
CircleCollider;
RectCollider;
Body;
CircleRenderer;
RectRenderer;
ImageRenderer2D;
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
    get active() {
        let root = this.transform;
        let found = false;
        while (!found) {
            if (typeof root == 'number') {
                break;
            }
            root = root.parent;
        }
        return root === Scene.active;
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
    addComponent(toAdd) {
        /*
            Checks if the component is viable on the sprite, and if it is not,
            then refuses to add it or overrides the problematic component.
            For example, if you try to add a rectRenderer while a CircleRenderer already exists,
            the CircleRenderer will be deleted and then the RectRenderer will be added
         */
        if (toAdd.type === 'transform')
            return;
        for (const component of this.components) {
            if (component.type === 'GUIElement') {
                if (toAdd.type !== 'Renderer')
                    continue;
                if (!['Renderer', 'Body', 'Camera'].includes(toAdd.type))
                    continue;
            }
            if (toAdd.type === 'GUIElement') {
                // favour the listed types rather than a GUIElement
                if (['Renderer', 'Body', 'Camera', 'Collider'].includes(component.type))
                    return;
            }
            if (component.type !== toAdd.type)
                continue;
            if (component.subtype !== toAdd.subtype)
                continue;
            // remove offending component
            this.components.splice(this.components.indexOf(component), 1);
        }
        this.components.push(toAdd);
    }
    hasComponent(type, subType = '') {
        if (type.toLowerCase() === 'transform')
            return true;
        for (let c of this.components)
            if ((c.type === type &&
                (c.subtype === subType || subType === '')) || c.subtype === type)
                return true;
        return false;
    }
    getComponent(type, subType = '') {
        if (type.toLowerCase() === 'transform')
            return this.transform;
        // returns the first component of passed type
        let component = this.components.find(c => (c.type === type &&
            (c.subtype === subType || subType === '')) || c.subtype === type);
        // as scripts are going to be handled differently, check them next
        if (component === undefined)
            component = this.getComponents('Script').find(c => c.subtype === subType || c.subtype === type);
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
            delete Sprite.sprites.splice(i, 1)[0];
        }
    }
    getClone() {
        return __awaiter(this, void 0, void 0, function* () {
            const { sprite, parentInfo } = yield getSpriteFromJSON(this.json());
            setParentFromInfo(parentInfo, sprite.transform);
            return sprite;
        });
    }
    json() {
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
        Sprite.loop((sprite) => {
            if (sprite.tag === tag)
                sprites.push(sprite);
        });
        return sprites;
    }
    static loop(handler) {
        for (const sprite of Sprite.sprites)
            handler(sprite);
    }
}
// -------------- static stuff ------------
Sprite.sprites = [];
