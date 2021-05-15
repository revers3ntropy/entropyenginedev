import { Component, Transform } from './component.js'
import { v2 } from "./maths.js"
import {Body, PhysicsMaterial} from "./physics.js";
import {CircleCollider} from "./collisions.js";
import {CircleRenderer} from "./renderComponents.js";

// all components
import {RectCollider} from './collisions.js'
import {ImageRenderer, RectRenderer} from './renderComponents.js'
import {GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox} from './gui.js'
import {Camera} from './camera.js'
import {Script} from "./scripts.js"
import {deepClone, expandV2} from "./util.js";
import {getSpriteFromJSON} from "./JSONprocessor.js";

// reference everything so the ts compiler will think that it is being used and wont delete the import
CircleCollider; RectCollider;
Body; PhysicsMaterial;
CircleRenderer; RectRenderer; ImageRenderer;
GUIBox; GUIText; GUITextBox; GUIRect; GUICircle; GUIPolygon; GUIImage;
Camera;
Script;

export type spriteConfig = {
    name: string
    components: Component[]
    tag: string | undefined
    transform: Transform
    Static: boolean
};

export class Sprite {
    name: string;
    components: Component[];
    id: number;
    tag: string;
    transform: Transform;
    Static: boolean;

    constructor (config: spriteConfig) {
        this.tag = config.tag ?? 'sprite';
        this.name = config.name ?? 'new sprite';
        this.components = config.components ?? [];
        this.transform = config.transform ?? new Transform({})
        this.Static = config.Static ?? false

        this.id = this.generateID();
    }

    generateID (): number {
        let id = 0;

        let idsInUse = Sprite.sprites.map(sprite => sprite.id);

        function getID () {
            return Math.floor(Math.random() * 10**5);
        }

        while (idsInUse.indexOf(id) > -1)
            id = getID();

        return id;
    }

    tick () {
        for (let component of this.components)
            component.tick(this.transform);
    }

    addComponent (component: Component) {
        this.components.push(component);
    }

    hasComponent (type: string, subType = ''): boolean {
        if (type === 'transform') return true;

        for (let c of this.components)
            if (
                (
                    c.type === type &&
                    (c.subtype === subType || subType === '')
                ) || c.subtype === type
            )
                return true;

        return false;
    }


    getComponent <Type extends Component> (type: string, subType = ''): Type {
        if (type === 'transform') return this.transform as unknown as Type;

        // returns the first component of passed type
        let component = this.components.find(c => (
            c.type === type &&
            (c.subtype === subType || subType === '')
        ) || c.subtype === type);

        if (component === undefined)
            component = this.getComponents('Script').find(c =>
                c.subtype === subType || c.subtype === type
            )

        if (component === undefined)
            throw new Error(`Cannot find component of type ${type} on sprite ${this.name}`);

        return component as Type;
    }

    getComponents <Type extends Component> (type: string, subType=''): Type[] {
        // returns all components of that type
        let components: Type[] = [];

        for (const component of this.components)
            if (
                component.type === type &&
                (component.subtype === subType || subType === '')
            ) components.push(component as Type);

        return components;
    }

    delete () {
        for (let i = 0; i < Sprite.sprites.length; i++) {
            const sprite = Sprite.sprites[i];

            if (!Object.is(sprite, this)) continue;

            delete Sprite.sprites[i];
            Sprite.sprites.splice(i, 1);
        }
    }

    async getClone () {
        const [sprite, parent] = await getSpriteFromJSON(this.json());
        sprite.transform.parent = Sprite.find(parent)?.transform || undefined;
        return sprite;
    }

    json (): any {
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
        }
    }

    // -------------- static stuff ------------
    static sprites: Sprite[] = [];

    static newSprite(setup: spriteConfig) {
        const newSprite = new Sprite(setup);
        Sprite.sprites.push(newSprite);
        return newSprite;
    }

    static fill ({
        position = new v2(0, 0),
        dimensions = new v2(10, 10),
        particleRadius = 5,
        material = new PhysicsMaterial({}),
         gravityAttract = v2.zero,
        gravityEffect = 0,
        name = 'fluid',
        colour = `rgb(0, 0, 0)`,
        Static = false
    }) {
        /*
            fills a rectangle with lots of balls, to create a kind of fluid. Not an efficient or good fluid simulator,
            just to allow the easy creation of lots of similar sprites.
         */
        let fluid: Sprite[] = [];
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
                        new CircleRenderer({colour})
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

    static find (name = "") {
        const sprite = Sprite.sprites.find((sprite: Sprite) => {
            return sprite.name === name;
        });

        if (!sprite) return undefined;

        return sprite as Sprite;
    }

    static findWithTag (tag: string) {
        let sprites: Sprite[] = [];
        Sprite.loopThroughSprites((sprite: Sprite) => {
            if (sprite.tag === tag)
                sprites.push(sprite);
        });
        return sprites;
    }

    static loopThroughSprites (handler: (sprite: Sprite) => void) {
        for (const sprite of Sprite.sprites)
            handler(sprite);
    }
}