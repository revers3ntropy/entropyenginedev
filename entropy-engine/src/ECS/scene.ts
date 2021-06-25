import {Sprite} from './sprite.js';
import {Camera} from "../components/camera.js";
import {v3} from "../util/maths/maths3D.js";
import {colour, parseColour, rgb} from "../util/colour.js";
import {Script} from "../components/scriptComponent";

export type background = {
    tint?: colour,
    image?: string
}

export type sceneSettings = {
    // license + general
    license: string;
    version: string;
    gameName: string;

    // rendering
    maxFrameRate: number;
    timeScale: number;
    background: background

    // physics
    G: number,
    globalGravity: v3,
    collisionIterations: number;

    // sound
    globalVolume: number;

}

export const defaultSceneSettings = (): sceneSettings => ({
    license: '0000',
    version: '0.0.0',
    gameName: 'my game',

    maxFrameRate: 60,
    timeScale: 1,
    background: {
        tint: rgb(255, 255, 255)
    },

    G: 9.8,
    globalGravity: new v3(0, -1, 0),
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
    }
    
    json () {
        return {
            name: this.name,
            settings: {
                license: this.settings.license,
                version: this.settings.version,
                gameName: this.settings.gameName,

                maxFrameRate: this.settings.maxFrameRate,
                timeScale: this.settings.timeScale,
                background: {
                    tint: this.settings.background?.tint?.json || parseColour('white').json,
                    image: this.settings.background.image,
                },

                G: this.settings.G,
                globalGravity: this.settings.globalGravity.array,
                collisionIterations: this.settings.collisionIterations,

                globalVolume: this.settings.globalVolume
            }
        }
    }

    get sprites (): Sprite[] {
        const queue: Sprite[] = [];
        const sprites: Sprite[] = [];

        for (const sprite of Sprite.sprites) {
            if (sprite.transform.isChild()) continue;
            if (sprite.transform.parent !== this.id) continue;

            queue.push(sprite);
        }

        while (queue.length > 0) {
            for (let child of queue[0].transform.children) {
                queue.push(child);
            }

            // there must be an element so shift can't return undefined, but ts doesn't kow that
            sprites.push( <Sprite> queue.shift());
        }

        return sprites;
    }

    findMainCamera () {
        for (const sprite of this.sprites) {
            if (!sprite.hasComponent('Camera')) continue;

            Camera.main = sprite;
            return;
        }
        console.error(`
            No sprites with component of type 'camera' can be found. 
            Make sure that there is at least one sprite in the scene '${Scene.activeScene.name}' with a 'Camera' component attached
        `);
    }

    loopThroughScripts (handler: (script: Script, sprite: Sprite) => void) {
        for (const sprite of this.sprites) {
            for (const script of sprite.getComponents('Script'))
                handler(script as Script, sprite as Sprite);
        }
    }
    broadcast (funcName: string, params: any[]) {
        this.loopThroughScripts((script: Script, sprite: Sprite) => {
            script.runMethod(funcName, params);
        });
    }

    static loopThroughAllScripts (handler: (script: Script, sprite: Sprite) => void) {
        Sprite.loop(sprite => {
            for (const script of sprite.getComponents('Script'))
                handler(script as Script, sprite as Sprite);
        });
    }



    //      STATIC

    static scenes: Scene[] = [];
    
    static active = 0;

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
        name: string
    }) {
        const scene = new Scene(config.name || 'Scene', defaultSceneSettings());
        Scene.scenes.push(scene);
        return scene;
    }

    static next (persists: Sprite[]) {
        Scene.active++;
        
        if (Scene.active > Scene.scenes.length-1) {
            Scene.active = 0;
        }
        
        // move sprites to current scene
        for (let sprite of persists) {
            if (typeof sprite.transform.parent === 'number'){
                sprite.transform.parent = Scene.active;
            }
        }

        Scene.activeScene.findMainCamera();
    }

    static previous (persists: Sprite[]) {
        Scene.active--;

        if (Scene.active < 0) {
            Scene.active = Scene.scenes.length-1;
        }

        // move sprites to current scene
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