;/*
import {Entity} from "../ECS/entity.js";
import { Script } from '../components/scriptComponent.js';
import { Transform } from '../index.js';
import {publicField, publicFieldConfig} from "../publicField.js";
export abstract class JSBehaviour {
    name: string | undefined;
    entity: Entity | undefined;
    transform: Transform | undefined;
    component: Script | undefined;
    started: boolean;

    tempPublic: publicField<any>[];

    get public (): publicField<any>[] {
        return this?.component?.public || [];
    }
    
    // these are not used internally, but by the user when creating scripts
    public addPublic<T>(config: publicFieldConfig<T>) {
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
        this.tempPublic.push(field);

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

    public getPublic (name: string) {
        if (this.started)
            return this.component?.getPublic(name);

        for (let field of this.tempPublic) {
            if (field.name === name) {
                return field.value;
            }
        }
    }

    public setPublic (name: string, value: any) {
        if (this.started)
            return this.component?.setPublic(name, value);

        for (let field of this.tempPublic) {
            if (field.name === name) {
                field.value = value;
            }
        }
    }

    public hasPublic (name: string): boolean {
        if (this.started)
            return !!this.component?.hasPublic(name);


        for (let field of this.public) {
            if (field.name === name) {
                return true;
            }
        }

        return false;
    }

    protected constructor() {
        this.tempPublic = [];
        this.started = false;
    }

    // Magic Methods
    abstract Start: () => void;
    abstract Update: () => void;
    abstract onCollision: (collisionWith: Entity) => void;
    abstract onMouseDown: () => void;
    abstract onMouseUp: () => void;
    abstract onClick: () => void;
}
 //*/