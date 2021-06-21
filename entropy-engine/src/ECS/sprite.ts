import { Component } from './component.js'
import { Body} from "../physics/body.js"
import {CircleRenderer} from "./components/renderComponents.js";

// all components
import {RectCollider, CircleCollider} from '../ECS/components/colliders.js'
import {ImageRenderer2D, RectRenderer} from './components/renderComponents.js'
import {GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox} from './components/gui.js'
import {Camera} from './components/camera.js'
import {Script} from "./components/scriptComponent.js"
import {getSpriteFromJSON, setParentFromInfo} from "../util/JSONprocessor.js";
import { Transform } from './transform.js';
import { Scene } from './scene.js';

// reference everything so the ts compiler will think that it is being used and wont delete the import
CircleCollider; RectCollider;
Body;
CircleRenderer; RectRenderer; ImageRenderer2D;
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
    
    get active (): boolean {
        let root: Transform | number = this.transform;
        let found = false;
        
        while (!found) {
            if (typeof root == 'number') {
                break;
            }
            root = root.parent;
        }
        
        return root === Scene.active;
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

    addComponent (toAdd: Component) {
        /*
            Checks if the component is viable on the sprite, and if it is not,
            then refuses to add it or overrides the problematic component.
            For example, if you try to add a rectRenderer while a CircleRenderer already exists,
            the CircleRenderer will be deleted and then the RectRenderer will be added
         */
        if (toAdd.type === 'transform') return;

        for (const component of this.components) {

            if (component.type === 'GUIElement'){
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
            this.components.splice(this.components.indexOf(component),1);
        }
        this.components.push(toAdd);
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
        if (type.toLowerCase() === 'transform')
            return this.transform as unknown as Type;

        // returns the first component of passed type
        let component = this.components.find(c => (
            c.type === type &&
            (c.subtype === subType || subType === '')
        ) || c.subtype === type);

        // as scripts are going to be handled differently, check them next
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

            Sprite.sprites.splice(i, 1);
            delete Sprite.sprites[i];
        }
    }

    async getClone () {
        const {sprite, parentInfo} = await getSpriteFromJSON(this.json());
        setParentFromInfo(parentInfo, sprite.transform);
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

    static find (name = "") {
        const sprite = Sprite.sprites.find((sprite: Sprite) => {
            return sprite.name === name;
        });

        if (!sprite)
            return undefined;

        return sprite as Sprite;
    }

    static findWithTag (tag: string) {
        let sprites: Sprite[] = [];
        Sprite.loop((sprite: Sprite) => {
            if (sprite.tag === tag)
                sprites.push(sprite);
        });
        return sprites;
    }

    static loop (handler: (sprite: Sprite) => void) {
        for (const sprite of Sprite.sprites)
            handler(sprite);
    }
}