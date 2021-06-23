import { Sprite } from '../ECS/sprite.js'
import {v2, v3} from "./maths/maths.js";
import {Component} from "../ECS/component.js";
import {Script} from "../ECS/components/scriptComponent.js"
// all components
import {CircleCollider, RectCollider} from '../ECS/components/colliders.js';
import {Body} from '../ECS/components/body.js';
import {CircleRenderer, ImageRenderer2D, RectRenderer, MeshRenderer} from '../ECS/components/renderComponents.js'
import {GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox} from '../ECS/components/gui.js'
import {Camera} from '../ECS/components/camera.js'
import {rgb, Transform } from '../index.js';
import { Scene } from '../ECS/scene.js';

// reference everything so the ts compiler will think that it is being used and wont delete the import
CircleCollider; RectCollider;
Body;
CircleRenderer; RectRenderer; ImageRenderer2D; MeshRenderer;
GUIBox; GUIText; GUITextBox; GUIRect; GUICircle; GUIPolygon; GUIImage;
Camera;

const limit = 200000;
const cacheBust = Math.floor(Math.random() * (limit+1));

function isV2(o: any) {

    if (!o) return false;
    if (!Array.isArray(o)) return false;

    return (o.length === 2 &&
        typeof o[0] === 'number' &&
        typeof o[1] === 'number'
    );
}

function isV3(o: any) {

    if (!o) return false;
    if (!Array.isArray(o)) return false;

    return (o.length === 3 &&
        typeof o[0] === 'number' &&
        typeof o[1] === 'number' &&
        typeof o[2] === 'number')
}

function isColour (o: any) {
    if (!o) return false;
    if (typeof o.r !== 'number') return false;
    if (typeof o.g !== 'number') return false;
    return typeof o.b === 'number';
}

function componentPropProcessor (propName: any, componentJSON: any, component: Component | any) {
    // stop it overriding 'type'
    if (propName === 'type' || propName === 'subType') return;

    if (isColour(componentJSON[propName])) {
        const c = componentJSON[propName];
        component[propName] = rgb(c.r, c.g, c.b, c.a);
        return;
    }

    if (!Array.isArray(componentJSON[propName])) {
        component[propName] = componentJSON[propName];
        return;
    }

    // checks arrays two layers deep
    if (isV2(componentJSON[propName])) {
        component[propName] = v2.fromArray(componentJSON[propName]);
        return;
    }
    else if (isV3(componentJSON[propName])) {
        component[propName] = v3.fromArray(componentJSON[propName]);
        return;
    }

    component[propName] = componentJSON[propName];
}

function dealWithTransform (transformJSON: any) {
    let parentInfo = transformJSON['parent'];

    const transform = new Transform({});

    transform.position = v3.fromArray(transformJSON['position']);
    transform.scale = v3.fromArray(transformJSON['scale']);
    transform.rotation = v3.fromArray(transformJSON['rotation']);

    return {parentInfo, transform};
}

async function dealWithScriptComponent (componentJSON: any): Promise<Script | undefined> {

    // two parts to a script: path and name
    const path = componentJSON['path'];
    // use either a specified name or the name of the file (found using some regex)
    const className = componentJSON['name'] || componentJSON['className']
    // gets name of file
    path.replace(/^.*[\\\/]/, '')
        // gets everything before the '.extension'
        .split('.')[0];

    let file: any;
    try {
        file = await import(`${path}?${cacheBust}`);
    } catch (e) {
        console.error(`Script Error: ${e}`);
        return;
    }
    // evaluate the script name as JS code, like when instantiating the component
    try {
        const script = new Script({
            script: new (file[className])()
        });
        script.name = className;
        script.scriptName = className;

        // set the values from the temp created when initialising the script
        for (let field of script?.script?.tempPublic || []) {
            script.public.push(field);
        }

        // then override them with the saved values
        if (Array.isArray(componentJSON['public'])) {
            for (let field of componentJSON['public']) {
                if (!script.hasPublic(field['name'])) continue;
                
                let value = field['value'];

                if (field['type'] === 'v2')
                    value = v2.fromArray(field['value']);
                else if (field['type'] === 'v3')
                    value = v3.fromArray(field['value']);

                script.setPublic(field['name'], value);

            }
        }

        return script;

    } catch (E) {
        console.error(`Error initialising script '${componentJSON['name'] || 'unnamed script'}': ${E}`);
    }
    return;
}

async function componentProccessor(componentJSON: any): Promise<Component|undefined> {
    let component;
    if (componentJSON['type'] === 'Script') {
        // deal with scripts separately
        return await dealWithScriptComponent(componentJSON);
    }

    // dynamically generate component from class
    try {
        component = new (eval(componentJSON['type']))({});
    } catch (E) {
        console.error(`Couldn't create component ${componentJSON}: ${E}`);
        return;
    }

    for (let prop in componentJSON) {
        if (!componentJSON.hasOwnProperty(prop)) continue;

        componentPropProcessor(prop, componentJSON, component);
    }

    return component;
}

export async function getSpriteFromJSON (JSON: any) {
    /*
        Needs MUCH more error checking as you can pass anything as the JSON into it
     */
    const name: string = JSON['name'] ?? `sprite ${Sprite.sprites.length}`;
    const tag: string = JSON['tag'] ?? 'sprite';
    const Static: boolean = JSON['Static'] ?? false;

    const componentsJSON = JSON['components'] ?? [];
    let components: Component[] = [];

    const transformJSON = JSON['transform'];
    const {parentInfo, transform} = dealWithTransform(transformJSON);
    // components
    for (let componentJSON of componentsJSON) {
        const component = await componentProccessor(componentJSON);

        if (component)
            components.push(component);
    }

    return {
        sprite: new Sprite({
            name,
            components,
            transform,
            tag,
            Static
        }),
        parentInfo
    };
}

export function setParentFromInfo (parentInfo: {type: string, name: string}, child: Transform | undefined) {

    let parent: Transform | number | undefined;

    if (parentInfo.type === 'Transform') {
        parent = Sprite.find(parentInfo.name)?.transform;

    } else if (parentInfo.type === 'Scene') {
        parent = Scene.sceneByID(parseInt(parentInfo.name)).id;
    }

    if (parent == undefined) {
        parent = Scene.active;
    }

    child?.makeChildOf(parent);
}


export async function spritesFromJSON (JSON: any) {

    let parentPairs: {[key: string]: {type: string, name: string}} = {};

    for (let spriteJSON of JSON) {
        let sprite = await getSpriteFromJSON(spriteJSON);
        parentPairs[sprite.sprite.name] = sprite.parentInfo;
        Sprite.sprites.push(sprite.sprite);
    }

    // deal with parent-child stuff once all sprites have been initialised
    for (let childName in parentPairs) {
        setParentFromInfo(parentPairs[childName], Sprite.find(childName)?.transform);
    }
}

export function initialiseScenes (JSON: any) {
    for (let scene of JSON) {
        Scene.create(scene);
    }
}