import { Entity } from './ECS/entity.js';
import {v2, v3} from "./maths/maths.js";
import {Component} from "./ECS/component.js";
import {Script} from "./components/scriptComponent.js";
// all components
import {CircleCollider, RectCollider} from './components/colliders.js';
import {Body} from './components/body.js';
import {CircleRenderer, ImageRenderer2D, RectRenderer, MeshRenderer} from './components/renderComponents.js';
import {GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox} from './components/gui/gui.js';
import {Camera} from './components/camera.js';
import { Transform} from "./components/transform.js";
import {defaultSceneSettings, Scene, sceneSettings} from './ECS/scene.js';
import {rgba} from "./util/colour.js";
import {nameFromScriptURL} from './util/general.js';
import {run} from "./scripting/EEScript/index.js";
import {ESBehaviourInstance} from "./scripting/EEScript/ESBehaviour.js";

// reference everything so the ts compiler will think that it is being used and wont delete the import
CircleCollider; RectCollider;
Body;
CircleRenderer; RectRenderer; ImageRenderer2D; MeshRenderer;
GUIBox; GUIText; GUITextBox; GUIRect; GUICircle; GUIPolygon; GUIImage;
Camera;

const cacheBust = Math.floor(Math.random() * 200001);

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
        component[propName] = rgba(c.r, c.g, c.b, c.a);
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

    } else if (isV3(componentJSON[propName])) {
        component[propName] = v3.fromArray(componentJSON[propName]);
        return;
    }

    component[propName] = componentJSON[propName];
}

function dealWithTransform (transformJSON: any) {
    let parentInfo = transformJSON['parent'];

    const transform = new Transform({});

    if (transformJSON['position'])
        transform.position = v3.fromArray(transformJSON['position']);
    if (transformJSON['scale'])
        transform.scale = v3.fromArray(transformJSON['scale']);
    if (transformJSON['rotation'])
        transform.rotation = v3.fromArray(transformJSON['rotation']);

    return {parentInfo, transform};
}

async function dealWithScriptComponent (componentJSON: any): Promise<Script | undefined> {

    // two parts to a script: path and name
    const path = componentJSON['path'];
    // use either a specified name or the name of the file (found using some regex)
    const className = componentJSON['name'] || componentJSON['className']
    // gets name of file

    let scriptNode: undefined | ESBehaviourInstance;

    try {
        let scriptData = await fetch(`${path}?${cacheBust}`);
        let scriptRaw = await scriptData.text();
        let name = nameFromScriptURL(path);

        let res = run(scriptRaw);
        if (res.error) {
            console.log(res.error.str);
            return;
        }

        let node;

        for (let line of res.val) {
            if (!(line instanceof ESBehaviourInstance)) continue;
            if (line.name !== name) continue;
            node = line;
            break;
        }

        if (!(node instanceof ESBehaviourInstance)) {
            console.error('Node not instance of N_ESBehaviour: ', node)
            return;
        }

        scriptNode = node;
    } catch (e) {
        console.error(`Script Error: ${e}`);
        return;
    }
    // evaluate the script name as JS code, like when instantiating the component
    try {
        const script = new Script({
            script: scriptNode
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

export async function getEntityFromJSON (JSON: any) {
    /*
        Needs MUCH more error checking as you can pass anything as the JSON into it
     */
    const name: string = JSON['name'] ?? `entity ${Entity.entities.length}`;
    const tag: string = JSON['tag'] ?? 'entity';
    const Static: boolean = JSON['Static'] ?? false;

    const componentsJSON = JSON['components'] ?? [];
    let components: Component[] = [];

    const transformJSON = JSON['transform'];
    const {parentInfo, transform} = dealWithTransform(transformJSON || {});
    // components
    for (let componentJSON of componentsJSON) {
        const component = await componentProccessor(componentJSON);

        if (component)
            components.push(component);
    }

    return {
        entity: new Entity({
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
        parent = Entity.find(parentInfo.name)?.transform;

    } else if (parentInfo.type === 'Scene') {
        parent = Scene.sceneByID(parseInt(parentInfo.name)).id;
    }

    if (parent == undefined) {
        parent = Scene.active;
    }

    child?.makeChildOf(parent);
}


export async function entitiesFromJSON (JSON: any) {

    let parentPairs: {[key: string]: {type: string, name: string}} = {};
    if (!Array.isArray(JSON)) {
        console.error('Cannot initialise entities from JSON ', JSON);
        return;
    }

    for (let entityJSON of JSON) {
        let entity = await getEntityFromJSON(entityJSON);
        parentPairs[entity.entity.name] = entity.parentInfo;
        Entity.entities.push(entity.entity);
    }

    // deal with parent-child stuff once all entities have been initialised
    for (let childName in parentPairs) {
        // no parent has been specified
        if (!parentPairs[childName]) continue;

        setParentFromInfo(parentPairs[childName], Entity.find(childName)?.transform);
    }
}

export function initialiseScenes (JSON: any) {
    for (let scene of JSON) {
        const settings: sceneSettings = defaultSceneSettings();
        const settingsJSON = scene['settings'] ?? {};
        for (let prop in settingsJSON) {
            componentPropProcessor(prop, scene['settings'] || {}, settings);
        }
        Scene.create({
            name: scene.name,
            settings
        });
    }
}