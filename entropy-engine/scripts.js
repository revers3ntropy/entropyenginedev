import { Component } from './component.js';
import { Sprite } from "./sprite.js";
export class JSBehaviour {
    constructor() { }
    Start_(sprite) {
        // assign properties from a Sprite instance to be accessible by 'this' in scripts
        this.sprite = sprite;
        this.name = sprite.name;
        this.transform = sprite.transform;
    }
}
export class Script extends Component {
    constructor(config) {
        var _a, _b, _c, _d;
        super("Script", (_c = (_b = (_a = config.script) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : 'noscript');
        // only used in the visual editor for downloading the script name
        this.scriptName = '';
        this.script = config.script;
        this.shouldProfile = (_d = config.profile) !== null && _d !== void 0 ? _d : false;
        if (Script.runStartMethodOnInit)
            this.runMethod('Start', []);
    }
    json() {
        var _a, _b;
        return {
            'type': 'Script',
            'shouldProfile': this.shouldProfile,
            // assume that the script src is in scripts.js
            'path': 'scripts.js',
            'name': (this === null || this === void 0 ? void 0 : this.scriptName) || ((_a = this.script) === null || _a === void 0 ? void 0 : _a.constructor.name),
            'scriptName': (this === null || this === void 0 ? void 0 : this.scriptName) || ((_b = this.script) === null || _b === void 0 ? void 0 : _b.constructor.name)
        };
    }
    setScript(script) {
        this.script = script;
        this.subtype = this.script.constructor.name;
        if (Script.runStartMethodOnInit)
            this.runMethod('Start', []);
    }
    runMethod(functionName, args) {
        const start = performance.now();
        // @ts-ignore
        if (typeof this.script[functionName] !== 'function') {
            // @ts-ignore
            this.script[functionName] = (...args) => { };
        }
        try {
            // @ts-ignore
            this.script[functionName](...args);
        }
        catch (E) {
            console.error(`Failed to run magic method '${functionName}' on JSBehaviour '${this.subtype}': ${E}`);
        }
        if (this.shouldProfile)
            console.log(`JSBehaviour '${this.subtype}' took ${performance.now() - start}ms to call magic method '${functionName}'`);
    }
    tick() {
        this.runMethod('Update', []);
    }
}
Script.runStartMethodOnInit = false;
// not exposed
export const scriptManager = {
    loopThroughScripts: (handler) => {
        Sprite.loopThroughSprites(sprite => {
            for (const script of sprite.getComponents('Script'))
                handler(script, sprite);
        });
    },
    runStartAll: () => {
        scriptManager.loopThroughScripts((script, sprite) => {
            var _a;
            (_a = script.script) === null || _a === void 0 ? void 0 : _a.Start_(sprite);
            script.runMethod('Start', []);
        });
    },
    collide: (sprite1, sprite2) => {
        for (let component of sprite1.components)
            if (component.type === 'Script')
                component.runMethod('onCollision', [sprite2]);
        for (let component of sprite2.components)
            if (component.type === 'Script')
                component.runMethod('onCollision', [sprite1]);
    }
};
