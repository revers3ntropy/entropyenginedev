import {Component} from '../component.js';
import {JSBehaviour} from '../../scripting/scripts.js';
import { loopThroughScripts } from '../../util/util.js';
import { v2, v3 } from '../../util/maths/maths.js';

export class Script extends Component {

    static runStartMethodOnInit = false;

    script: JSBehaviour | undefined;
    // only used in the visual editor for downloading the script name
    scriptName = '';
    name = '';

    constructor(config: {
        script: JSBehaviour | undefined,
    }) {
        super("Script", config.script?.constructor?.name ?? 'noscript')
        this.script = config.script;

        this.public = this?.script?.public || [];

        if (Script.runStartMethodOnInit){
            this.runMethod('Start_', [this.sprite]);
            this.runMethod('Start', []);
        }

    }

    public jsonPublic (): object[] {
        let json: object[] = [];

        for (let field of this.public) {
            const fieldJSON: any = {};
            let field_: any = field;

            for (const prop in field) {
                if (prop !== 'value') {
                    fieldJSON[prop] = field_[prop];
                     continue;
                }

                if (field_[prop] instanceof v2 || field_[prop] instanceof v3) {
                    fieldJSON[prop] = field_[prop].array;
                } else {
                    fieldJSON[prop] = field_[prop];
                }

            }

            json.push(fieldJSON);
        }

        return json;
    }

    json () {
        return {
            'type': 'Script',
            // assume that the script src is in scripts.js
            'path': 'scripts.js',
            'name': this?.scriptName || this.script?.constructor.name,
            'scriptName': this?.scriptName || this.script?.constructor.name,
            'public': this.jsonPublic(),
        }
    }

    setScript (script: JSBehaviour) {
        this.script = script;
        this.subtype = this.script.constructor.name;

        if (Script.runStartMethodOnInit)
            this.runMethod('Start', []);
    }

    runMethod (functionName: string, args: any[]) {

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

    }

    tick () {}

    static broadcast(funcName: string, params: any[]) {
        loopThroughScripts((script, sprite) => {
            script.runMethod(funcName, params);
        });
    }
}