import { Component, Transform } from './component.js'
import {Sprite} from "./sprite.js";
import {v2} from "./maths.js";
import {expandV2} from "./util";

export abstract class JSBehaviour {
    protected name: string | undefined;
    protected sprite: Sprite | undefined;
    protected transform: Transform | undefined;

    protected constructor() {}

    // Magic Methods
    abstract Start: () => void;
    abstract Update: () => void;
    abstract onCollision: (collisionWith: Sprite) => void;
    abstract onMouseDown: () => void;
    abstract onMouseUp: () => void;
    abstract onClick: () => void;

    Start_(sprite: Sprite) {
        // assign properties from a Sprite instance to be accessible by 'this' in scripts
        this.sprite = sprite;
        this.name = sprite.name;
        this.transform = sprite.transform;
    }
}

export class Script extends Component {

    static runStartMethodOnInit = false;

    script: JSBehaviour | undefined;
    shouldProfile: boolean;
    // only used in the visual editor for downloading the script name
    scriptName = '';

    constructor(config: {
        script: JSBehaviour | undefined,
        profile: boolean | undefined,
    }) {
        super("Script", config.script?.constructor?.name ?? 'noscript')
        this.script = config.script;
        this.shouldProfile = config.profile ?? false;

        if (Script.runStartMethodOnInit)
            this.runMethod('Start', []);
    }

    json () {
        return {
            'type': 'Script',
            'shouldProfile': this.shouldProfile,
            // assume that the script src is in scripts.js
            'path': 'scripts.js',
            'name': this?.scriptName || this.script?.constructor.name,
            'scriptName': this?.scriptName || this.script?.constructor.name
        }
    }

    setScript (script: JSBehaviour) {
        this.script = script;
        this.subtype = this.script.constructor.name;

        if (Script.runStartMethodOnInit)
            this.runMethod('Start', []);
    }

    runMethod (functionName: string, args: any[]) {
        const start = performance.now();

        // @ts-ignore
        if (typeof this.script[functionName] !== 'function') {
            // @ts-ignore
            this.script[functionName] = (...args: any) => {};
        }

        try {
            // @ts-ignore
            this.script[functionName](...args);
        } catch (E) {
            console.error(`Failed to run magic method '${functionName}' on JSBehaviour '${this.subtype}': ${E}`);
        }

        if (this.shouldProfile)
            console.log(`JSBehaviour '${this.subtype}' took ${performance.now() - start}ms to call magic method '${functionName}'`);
    }

    tick () {
        this.runMethod('Update', []);
    }
}

// not exposed
export const scriptManager = {
    loopThroughScripts: (handler: (script: Script, sprite: Sprite) => void) => {
        Sprite.loopThroughSprites(sprite => {
            for (const script of sprite.getComponents('Script'))
                handler(script as Script, sprite as Sprite);
        });
    },

    runStartAll: () => {
        scriptManager.loopThroughScripts((script, sprite) => {
            script.script?.Start_(sprite);
            script.runMethod('Start', []);
        });
    },

    collide: (sprite1: Sprite, sprite2: Sprite) => {
        for (let component of sprite1.components)
            if (component.type === 'Script')
                (component as Script).runMethod('onCollision', [sprite2]);


        for (let component of sprite2.components)
            if (component.type === 'Script')
                (component as Script).runMethod('onCollision', [sprite1]);
    }
}