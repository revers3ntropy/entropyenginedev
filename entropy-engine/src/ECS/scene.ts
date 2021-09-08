import {Entity} from './entity.js';
import {Camera} from "../components/camera.js";
import {v3} from "../maths/maths.js";
import {colour, rgb} from "../util/colour.js";
import {Script} from "../components/scriptComponent.js";
import {getCanvasStuff} from "../util/general.js";

export type sceneSettings = {
    // license + general
    license: string;
    version: string;
    gameName: string;

    // rendering
    canvasID: string;
    ctx?: CanvasRenderingContext2D;
    maxFrameRate: number;
    timeScale: number;
    backgroundTint: colour,
    backgroundImage?: string,

    // physics
    globalGravity: v3,
    collisionIterations: number;

    // sound
    globalVolume: number;
}

export const defaultSceneSettings = (): sceneSettings => ({
    license: '0000',
    version: '0.0.0',
    gameName: 'my game',

    canvasID: 'myCanvas',
    maxFrameRate: 60,
    timeScale: 1,

    backgroundTint: rgb.parse('white'),

    globalGravity: new v3(0, 0, 0),
    collisionIterations: 5,

    globalVolume: 1
});

export class Scene {
    id: number;
    name: string;
    settings: sceneSettings;

    constructor (name: string, settings: sceneSettings) {
        this.id = Scene.scenes.length;
        this.name = name;
        this.settings = settings;

        if (!settings.ctx) {
            const {ctx} = getCanvasStuff(settings.canvasID);
            settings.ctx = ctx;
        }
    }
    
    json () {
        return {
            name: this.name,
            settings: {
                license: this.settings.license,
                version: this.settings.version,
                gameName: this.settings.gameName,

                canvasID: this.settings.canvasID,
                maxFrameRate: this.settings.maxFrameRate,
                timeScale: this.settings.timeScale,
                backgroundTint: this.settings.backgroundTint?.json || rgb.parse('white').json,
                backgroundImage: this.settings.backgroundImage,

                globalGravity: this.settings.globalGravity.array,
                collisionIterations: this.settings.collisionIterations,

                globalVolume: this.settings.globalVolume
            }
        }
    }

    get entities (): Entity[] {
        const queue: Entity[] = [];
        const entities: Entity[] = [];

        for (const entity of Entity.entities) {
            if (entity.transform.isChild()) continue;
            if (entity.transform.parent !== this.id) continue;

            queue.push(entity);
        }

        while (queue.length > 0) {
            for (let child of queue[0].transform.children) {
                queue.push(child);
            }

            // there must be an element so shift can't return undefined, but ts doesn't kow that
            entities.push( <Entity> queue.shift());
        }

        return entities;
    }

    findMainCamera () {
        for (const entity of this.entities) {
            if (!entity.hasComponent('Camera')) continue;

            Camera.main = entity;
            return;
        }
        console.error(`
            No sprites with component of type 'camera' can be found. 
            Make sure that there is at least one sprite in the scene '${Scene.activeScene.name}' with a 'Camera' component attached
        `);
    }

    loopThroughScripts (handler: (script: Script, entity: Entity) => void) {
        for (const entity of this.entities) {
            for (const script of entity.getComponents('Script'))
                handler(script as Script, entity as Entity);
        }
    }
    broadcast (funcName: string, params: any[]) {
        this.loopThroughScripts((script: Script, entity: Entity) => {
            script.runMethod(funcName, params);
        });
    }

    static loopThroughAllScripts (handler: (script: Script, entity: Entity) => void) {
        Entity.loop(entity => {
            for (const script of entity.getComponents('Script'))
                handler(script as Script, entity as Entity);
        });
    }



    //      STATIC

    static scenes: Scene[] = [];
    
    static active_: number = 0;

    // @ts-ignore
    static set active (val: number | Scene) {
        if (val instanceof Scene)
            Scene.active_ = val.id;
        else
            Scene.active_ = val;
    }

    // @ts-ignore
    static get active (): number {
        return Scene.active_;
    }

    static get activeScene (): Scene {
        if (this.scenes.length < 1)
            throw 'No scenes found';
        
        return Scene.sceneByID(Scene.active);
    }

    static set activeScene (to: Scene) {
        Scene.active = to.id;
    }

    static sceneByName (name: string): Scene {
        const scene = Scene.scenes.filter(scene =>
            scene.name === name
        );
        
        if (scene === undefined || !scene[0] || !(scene[0] instanceof Scene)){
            console.error(`Cannot find scene name: ${name}`);
            throw Error();
        }
        
        return scene[0];
    }

    static sceneExistsWithID (id: number) {
        const scene = Scene.scenes.filter(scene =>
            scene.id === id
        )[0];

        return scene !== undefined;
    }

    static sceneByID (id: number): Scene {
        const scene = Scene.scenes.filter(scene =>
            scene.id === id
        )[0];
        
        if (scene === undefined) {
            console.error(`Cannot find scene ID: ${id} of type ${typeof id}. Creating empty scene to compensate. Scenes: ${Scene.scenes}`);
            const newScene = new Scene('Example Scene', defaultSceneSettings());
            Scene.scenes.push(newScene);
            return newScene;
        }
        
        return scene;
    }
    
    static create (config: {
        name?: string,
        settings?: sceneSettings
    }) {
        const scene = new Scene(config.name || 'Scene', config.settings || defaultSceneSettings());
        Scene.scenes.push(scene);

        if (Scene.scenes.length > 0 && !config.settings) {
            const defaultSettings: any = Scene.scenes[Scene.scenes.length-1].json().settings;
            defaultSettings.backgroundTint = new colour(255, 255, 255);
            defaultSettings.globalGravity = v3.fromArray(defaultSettings.globalGravity);
            scene.settings = defaultSettings;
        }

        return scene;
    }

    static next (persists: Entity[]) {
        // @ts-ignore
        Scene.active++;
        
        if (Scene.active > Scene.scenes.length-1) {
            Scene.active = 0;
        }
        
        // move entities to current scene
        for (let sprite of persists) {
            if (typeof sprite.transform.parent === 'number'){
                sprite.transform.parent = Scene.active;
            }
        }

        Scene.activeScene.findMainCamera();
    }

    static previous (persists: Entity[]) {
        // @ts-ignore
        Scene.active--;

        if (Scene.active < 0) {
            Scene.active = Scene.scenes.length-1;
        }

        // move entities to current scene
        for (let sprite of persists) {
            if (typeof sprite.transform.parent === 'number') {
                sprite.transform.parent = Scene.active;
            }
        }

        Scene.activeScene.findMainCamera();
    }

    static get sceneCount () {
        return Scene.scenes.length;
    }
}