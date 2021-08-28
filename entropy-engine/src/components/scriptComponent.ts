import {Component} from '../ECS/component.js';
import {global} from '../scripting/EEScript/constants.js';
import { v2, v3 } from '../maths/maths.js';
import {N_functionCall, Node} from '../scripting/EEScript/nodes.js';
import {Position} from "../scripting/EEScript/position.js";
import {Context} from "../scripting/EEScript/context.js";
import {ESError} from "../scripting/EEScript/errors.js";
import {Scene} from "../ECS/scene.js";
import {Entity} from "../ECS/entity.js";
import type {ESBehaviourInstance} from "../scripting/EEScript/ESBehaviour.js";

export class Script extends Component {
    static runStartMethodOnInit = false;

    script: ESBehaviourInstance | undefined;
    // only used in the visual editor for downloading the script name
    scriptName = '';
    name = '';

    constructor(config: {
        script: ESBehaviourInstance | undefined,
    }) {
        super("Script", config.script?.name ?? 'noscript')
        this.script = config.script;

        if (Script.runStartMethodOnInit) {
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
            'name': this?.script?.name || this?.scriptName || this.script?.constructor.name,
            'scriptName': this?.script?.name || this?.scriptName || this.script?.constructor.name,
            'public': this.jsonPublic(),
        }
    }

    setScript (script: ESBehaviourInstance) {
        this.script = script;
        this.subtype = this.script.name;

        if (Script.runStartMethodOnInit)
            this.runMethod('Start', []);
    }

    genContext (file: string): Context | ESError {
        let context = new Context(file);

        context.parent = global;
        let setRes = context.setOwn(this.script, 'this');
        if (setRes instanceof ESError) return setRes;

        if (this?.script?.entity) {
            setRes = context.setOwn(this?.script?.entity, 'entity');
            if (setRes instanceof ESError) return setRes;

            setRes = context.setOwn(this?.script?.entity.transform, 'transform');
            if (setRes instanceof ESError) return setRes;
        }

        setRes = context.setOwn(Scene.activeScene.broadcast, 'broadcast');
        if (setRes instanceof ESError) return setRes;

        setRes = context.setOwn(Entity, 'Entity');
        if (setRes instanceof ESError) return setRes;
        setRes = context.setOwn(Scene, 'Scene');
        if (setRes instanceof ESError) return setRes;

        return context;
    }

    runMethod (functionName: string, args: Node[] = []) {
        for (let method of this?.script?.methods ?? []) {
            if (method.name !== functionName) continue;

            const caller = new N_functionCall(Position.unknown, Position.unknown, method, args);
            let context = this.genContext(method.startPos.file);
            if (context instanceof ESError)
                return console.error(context.str);

            const res = caller.interpret(context);
            if (res.error) console.error(res.error.str);
            return;
        }
    }

    Update () {}
}