import { Sprite } from './sprite.js';
import { Camera } from "./components/camera.js";
import { v3 } from "../util/maths/maths3D.js";
import { parseColour, rgb } from "../util/colour.js";
export const defaultSceneSettings = () => ({
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
    constructor(name, settings) {
        this.id = Scene.scenes.length;
        this.name = name;
        this.settings = settings;
    }
    json() {
        var _a, _b;
        return {
            name: this.name,
            settings: {
                license: this.settings.license,
                version: this.settings.version,
                gameName: this.settings.gameName,
                maxFrameRate: this.settings.maxFrameRate,
                timeScale: this.settings.timeScale,
                background: {
                    tint: ((_b = (_a = this.settings.background) === null || _a === void 0 ? void 0 : _a.tint) === null || _b === void 0 ? void 0 : _b.json) || parseColour('white').json,
                    image: this.settings.background.image,
                },
                G: this.settings.G,
                globalGravity: this.settings.globalGravity.array,
                collisionIterations: this.settings.collisionIterations,
                globalVolume: this.settings.globalVolume
            }
        };
    }
    get sprites() {
        const queue = [];
        const sprites = [];
        for (const sprite of Sprite.sprites) {
            if (sprite.transform.isChild())
                continue;
            if (sprite.transform.parent !== this.id)
                continue;
            queue.push(sprite);
        }
        while (queue.length > 0) {
            for (let child of queue[0].transform.children) {
                queue.push(child);
            }
            // there must be an element so shift can't return undefined, but ts doesn't kow that
            sprites.push(queue.shift());
        }
        return sprites;
    }
    static get activeScene() {
        if (this.scenes.length < 1)
            throw 'No scenes found';
        return Scene.sceneByID(Scene.active);
    }
    static set activeScene(to) {
        Scene.active = to.id;
    }
    static sceneByName(name) {
        const scene = Scene.scenes.filter(scene => scene.name === name);
        if (scene === undefined || !scene[0] || !(scene[0] instanceof Scene)) {
            console.error(`Cannot find scene name: ${name}`);
            throw Error();
        }
        return scene[0];
    }
    static sceneByID(id) {
        const scene = Scene.scenes.filter(scene => scene.id === id)[0];
        if (scene === undefined) {
            console.error(`Cannot find scene ID: ${id} of type ${typeof id}. Creating empty scene to compensate. Scenes: ${Scene.scenes}`);
            const newScene = new Scene('Example Scene', defaultSceneSettings());
            Scene.scenes.push(newScene);
            return newScene;
        }
        return scene;
    }
    static create(config) {
        const scene = new Scene(config.name || 'Scene', defaultSceneSettings());
        Scene.scenes.push(scene);
        return scene;
    }
    static next(persists) {
        Scene.active++;
        if (Scene.active > Scene.scenes.length - 1) {
            Scene.active = 0;
        }
        // move sprites to current scene
        for (let sprite of persists) {
            if (typeof sprite.transform.parent === 'number') {
                sprite.transform.parent = Scene.active;
            }
        }
        Camera.findMain();
    }
    static previous(persists) {
        Scene.active--;
        if (Scene.active < 0) {
            Scene.active = Scene.scenes.length - 1;
        }
        // move sprites to current scene
        for (let sprite of persists) {
            if (typeof sprite.transform.parent === 'number') {
                sprite.transform.parent = Scene.active;
            }
        }
        Camera.findMain();
    }
    static get sceneCount() {
        return Scene.scenes.length;
    }
}
//      STATIC
Scene.scenes = [];
Scene.active = 0;
