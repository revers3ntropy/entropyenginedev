import {Entity} from "../../ECS/entity.js";
import {Transform} from "../../components/transform.js";
import {Script} from "../../components/scriptComponent.js";
import {publicField, publicFieldConfig} from "../../publicField.js";
import {Position} from "./position.js";
import {Context} from "./context.js";
import {v2} from "../../maths/v2.js";
import {v3} from "../../maths/v3.js";
import {N_function, N_objectLiteral, Node} from "./nodes.js";

export class N_ESBehaviour extends Node {

    private readonly entityNode: undefined | Node;

    private readonly publicVariables: N_objectLiteral[];

    private init: N_function | undefined;
    private readonly methods: N_function[];
    // wants to be accessed in various places
    public name: string;

    constructor(startPos: Position, endPos: Position, methods: N_function[], init?: N_function, name = '<anon ESBehaviour>', publicVariables: N_objectLiteral[] = [], entityNode?: Node) {
        super(startPos, endPos);
        this.init = init;
        this.methods = methods;
        this.name = name;
        this.publicVariables = publicVariables;
        this.entityNode = entityNode;
    }

    interpret_(context: Context) {
        let entity: any = undefined;
        if (this.entityNode) {
            let res = this.entityNode.interpret(context);
            if (res.error) return res;
            entity = res.val;
        }

        const instance = new ESBehaviourInstance(
            this.name,
            this.methods,
            entity
        );

        for (let method of this.methods) {
            // @ts-ignore
            instance[method.name] = new N_function(
                method.startPos,
                method.endPos,
                method.body,
                method.arguments,
                method.name
            );
        }

        for (let publicVarRaw of this.publicVariables) {
            let res = publicVarRaw.interpret(context);
            if (res.error) return res;

            let type = res?.val?.type || undefined;

            let value = res?.val?.value;

            if (value instanceof v2) type = 'v2';
            else if (value instanceof v3) type = 'v3';

            instance.addPublic({
                name: res?.val?.name || '',
                value,
                type,
                array: res?.val?.array || '',
                assetType: res?.val?.assetType || '',
                description: res?.val?.description || '',
                default: res?.val?.default || ''
            });
        }

        return instance;
    }
}

export class ESBehaviourInstance {
    // initialised with values externally in the entityController system
    public entity: Entity | undefined;
    public transform: Transform | undefined;
    public component: Script | undefined;

    public readonly methods: N_function[];

    name: string;

    tempPublic: publicField<any>[] = [];

    constructor (name: string, methods: N_function[], entity: Entity | undefined) {
        this.name = name;
        this.methods = methods;
        this.entity ??= entity;
    }

    get public (): publicField<any>[] {
        return this?.component?.public || [];
    }

    // these are not used internally, but by the user when creating scripts
    public addPublic = <T>(config: publicFieldConfig<T>) => {
        if (!config.name) {
            console.error(`Public fields must have 'name' property`);
            return;
        }

        if (this.hasPublic(config.name)){
            console.error('Cannot add property with existing name: ' + config.name);
            return;
        }

        // @ts-ignore - doesn't like comparison to string
        if (config.value === undefined && config.default === undefined) {
            console.error(`Public fields must have 'value' property`);
            return;
        }

        // @ts-ignore - doesn't like comparison to string
        if (config.value === undefined)
            config.value = config.default;

        const field = new publicField(config);

        if (!this.component) {
            this.tempPublic.push(field);
        } else {
            this.component.public.push(field);
        }

        Object.defineProperty(this, config.name, {
            // so you can loop over it
            enumerable: true,

            get () {
                if (config.overrideGet === undefined)
                    return this.getPublic(config.name)

                return config.overrideGet();
            },
            set (value) {
                if (config.overrideSet === undefined) {
                    this.setPublic(config.name, value);
                    return;
                }

                config.overrideSet(value);
            }
        });

        return field;
    }

    public getPublic = (name: string) => {
        return this.component?.getPublic(name);
    }

    public setPublic = (name: string, value: any) => {
        return this.component?.setPublic(name, value);
    }

    public hasPublic = (name: string): boolean => {
        return !!this.component?.hasPublic(name);
    }
}
