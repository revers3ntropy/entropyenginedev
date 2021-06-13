import { v3 } from '../util/maths/maths3D.js';
import {Sprite} from './sprite.js';

export class Scene {
    id: number;
    name: string;

    constructor (name: string) {
        this.id = Scene.scenes.length;
        this.name = name;
    }
    
    json () {
        return {
            name: this.name
        }
    }

    get sprites (): Sprite[] {
        const sprites: Sprite[] = [];

        for (const sprite of Sprite.sprites) {
            if (sprite.transform.isChild()) continue;
            if (sprite.transform.parent !== this.id) continue;

            sprites.push(sprite);
        }

        return sprites;
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

    static sceneByID (id: number): Scene {
        const scene = Scene.scenes.filter(scene =>
            scene.id === id
        )[0];
        
        if (scene === undefined) {
            console.error(`Cannot find scene ID: ${id} of type ${typeof id}. Scenes: ${Scene.scenes}`);
            throw Error;
        }
        
        return scene;
    }
    
    static create (config: {
        name: string
    }) {
        console.log('created');
        Scene.scenes.push(new Scene(config.name || 'Scene'));
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
    }
}