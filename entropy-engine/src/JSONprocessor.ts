import { Sprite } from './sprite.js'
import {v2} from "./maths.js";
import {Component, Transform} from "./component.js";
import {Script} from "./scripts.js"
// all components
import {CircleCollider, RectCollider} from './collisions.js';
import {Body, PhysicsMaterial} from "./physics.js";
import {CircleRenderer, ImageRenderer, RectRenderer} from './renderComponents.js'
import {GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox} from './gui.js'
import {Camera} from './camera.js'

// reference everything so the ts compiler will think that it is being used and wont delete the import
CircleCollider; RectCollider;
Body; PhysicsMaterial;
CircleRenderer; RectRenderer; ImageRenderer;
GUIBox; GUIText; GUITextBox; GUIRect; GUICircle; GUIPolygon; GUIImage;
Camera;

const limit = 100000;
const cacheBust = Math.floor(Math.random() * (limit+1));

function isV2(o: any) {

    if (!o) return false;
    if (!Array.isArray(o)) return false;

    return (o.length === 2 &&
        typeof o[0] === 'number' &&
        typeof o[1] === 'number')
}

export async function getSpriteFromJSON (JSON: any): Promise<[Sprite, string]> {
    /*
        Oh man what a horrible piece of code...
        I have really no idea how to tidy this up as working with JSON is such a pain sometimes
        I've just tried to brute force every possibility here,
        not really worrying about error checking, cleaning user input, or making it DRY
     */
    const name: string = JSON['name'] ?? `sprite ${Sprite.sprites.length}`;
    const tag: string = JSON['tag'] ?? 'sprite';
    const Static: boolean = JSON['Static'] ?? false;

    const componentsJSON = JSON['components'] ?? [];
    let components: Component[] = [];

    const transform = new Transform({})
    const transformJSON = JSON['transform'];

    let parentName = '';
    for (let transformPropertyJSON in transformJSON) {
        switch (transformPropertyJSON) {
            case 'position':
            case 'scale':
                if (!isV2(transformJSON[transformPropertyJSON])) {
                    console.error(`transform component '${transformPropertyJSON}' number be a v2. Sprite ${name}`);
                    break;
                }
                // either position or scale
                transform[transformPropertyJSON] = new v2(transformJSON[transformPropertyJSON][0], transformJSON[transformPropertyJSON][1])
                break;
            case 'rotation':
                transform.rotation = transformJSON[transformPropertyJSON];
                break;
            case 'parent':
                parentName = transformJSON[transformPropertyJSON]
                break;
        }
    }

    // components
    for (let componentJSON of componentsJSON) {
        let component;
        if (componentJSON['type'] === 'Script') {
            // deal with scripts separately

            // two parts to a script: path and name
            const path = componentJSON['path'];
            // use either a specified name or the name of the file (found using some regex)
            const className = componentJSON['name'] || componentJSON['className']
                // gets name of file
                path.replace(/^.*[\\\/]/, '')
                    // gets everything before the '.extension'
                    .split('.')[0];

            const file = await import(`${path}?${cacheBust}`);
            // evaluate the script name as JS code, like when instantiating the component
            try {
                const script: any = new Script({
                    script: new (file[className])(),
                    profile: componentJSON['profile']
                });
                
                script['name'] = className;
                script.scriptName = className;
                components.push(script);
                
            } catch (E) {
                console.error(`Couldn't find script ${componentJSON}: ${E}`);
            }
            continue;
        }

        // dynamically generate component from class
        try {
            component = new (eval(componentJSON['type']))({});
        } catch (E) {
            console.error(`Couldn't create component ${componentJSON}: ${E}`);
            continue;
        }

        for (let propertyJSON in componentJSON) {
            if (!componentJSON.hasOwnProperty(propertyJSON)) continue;
            // stop it overriding 'type'
            if (propertyJSON === 'type' || propertyJSON === 'subType') continue;

            if (propertyJSON === 'material') {
                // materials need to be a PhysicsMaterial instance, so deal with separately
                // just do each part of the material separately - not likely to change much
                // REMEMBER: when material changes this should change to
                component[propertyJSON] = new PhysicsMaterial({
                    friction: componentJSON[propertyJSON]['friction'],
                    airResistance: componentJSON[propertyJSON]['airResistance'],
                    bounciness: componentJSON[propertyJSON]['bounciness'],
                });
            }

            if (!Array.isArray(componentJSON[propertyJSON])) {
                component[propertyJSON] = componentJSON[propertyJSON];
                continue;
            }

            // checks arrays two layers deep
            if (isV2(componentJSON[propertyJSON])) {
                component[propertyJSON] = new v2(componentJSON[propertyJSON][0], componentJSON[propertyJSON][1]);
                continue;
            }

            let componentProperties = [];
            for (let componentInArray of componentJSON[propertyJSON]) {
                if (isV2(componentInArray))
                    // array of points
                    componentProperties.push(new v2(componentJSON[propertyJSON][0], componentJSON[propertyJSON][1]));
                else
                    // no clue what it is, just an array
                    componentProperties.push(componentJSON[propertyJSON]);
            }

            component[propertyJSON] = componentProperties;

        }

        components.push(component);
    }

    return [new Sprite({
        name,
        components,
        transform,
        tag,
        Static
    }), parentName]
}


export async function spritesFromJSON (JSON: any) {

    let parentPairs: {[key: string]: string} = {};

    for (let spriteJSON of JSON) {
        let sprite = await getSpriteFromJSON(spriteJSON);
        parentPairs[sprite[0].name] =  sprite[1];
        Sprite.sprites.push(sprite[0]);
    }

    // deal with parent-child stuff
    for (let childName in parentPairs) {
        const parent = Sprite.find(parentPairs[childName])?.transform;
        if (parent == undefined) continue;
        Sprite.find(childName)?.transform?.makeChildOf(parent)
    }
}