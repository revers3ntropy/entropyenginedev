import { Component } from '../component.js';
import { loopThroughScripts } from '../../util/util.js';
import { v2, v3 } from '../../util/maths/maths.js';
export class Script extends Component {
    constructor(config) {
        var _a, _b, _c, _d;
        super("Script", (_c = (_b = (_a = config.script) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : 'noscript');
        // only used in the visual editor for downloading the script name
        this.scriptName = '';
        this.name = '';
        this.script = config.script;
        this.public = ((_d = this === null || this === void 0 ? void 0 : this.script) === null || _d === void 0 ? void 0 : _d.public) || [];
        if (Script.runStartMethodOnInit) {
            this.runMethod('Start_', [this.sprite]);
            this.runMethod('Start', []);
        }
    }
    jsonPublic() {
        let json = [];
        for (let field of this.public) {
            const fieldJSON = {};
            let field_ = field;
            for (const prop in field) {
                if (prop !== 'value') {
                    fieldJSON[prop] = field_[prop];
                    continue;
                }
                if (field_[prop] instanceof v2 || field_[prop] instanceof v3) {
                    fieldJSON[prop] = field_[prop].array;
                }
                else {
                    fieldJSON[prop] = field_[prop];
                }
            }
            json.push(fieldJSON);
        }
        return json;
    }
    json() {
        var _a, _b;
        return {
            'type': 'Script',
            // assume that the script src is in scripts.js
            'path': 'scripts.js',
            'name': (this === null || this === void 0 ? void 0 : this.scriptName) || ((_a = this.script) === null || _a === void 0 ? void 0 : _a.constructor.name),
            'scriptName': (this === null || this === void 0 ? void 0 : this.scriptName) || ((_b = this.script) === null || _b === void 0 ? void 0 : _b.constructor.name),
            'public': this.jsonPublic(),
        };
    }
    setScript(script) {
        this.script = script;
        this.subtype = this.script.constructor.name;
        if (Script.runStartMethodOnInit)
            this.runMethod('Start', []);
    }
    runMethod(functionName, args) {
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
    }
    tick() { }
    static broadcast(funcName, params) {
        loopThroughScripts((script, sprite) => {
            script.runMethod(funcName, params);
        });
    }
}
Script.runStartMethodOnInit = false;
