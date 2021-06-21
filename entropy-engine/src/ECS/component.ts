import {Sprite} from "./sprite.js";
import { Transform } from "./transform.js";

export type publicFieldType = 'string' | 'number' | 'Asset' | 'Transform' | 'boolean' | 'json' | 'rgb' | 'v2' | 'v3';

export interface publicFieldConfig <T> {
    name: string,

    value?: T,
    
    type?: publicFieldType,
    array?: boolean,
    
    description?: string,
    default?: T,
    
    overrideGet?: () => T,
    overrideSet?: (val: T) => void
}

export class publicField<T> {

    type: publicFieldType;
    value: any;
    name: string;
    description: string;
    array: boolean;
    default: any;

    constructor(config: publicFieldConfig<T>) {
        this.array = config.array || false;
        this.type = config.type || <publicFieldType> typeof config.value || 'string';
        this.value = config.value;
        this.name = config.name;
        this.description = config.description || '';
        this.default = config.default;

        if (this.array) {
            if (this.value)
                if (!Array.isArray(this.value))
                    this.value = [this.value];
                else
                    this.value = [];
        }
    }
}

export abstract class Component {
    /*
        subtype so you can have three-level inheritance for components, e.g. Component ==> Renderer ==> RectRenderer
        subtype is RectRenderer, type is Renderer
        as sprites can only have a single of each type, can use 'getComponent(type)' without worrying about what type of that it is
        e.g. sprite.getComponent('Renderer').draw()
        instead of dealing with every possible renderer

        public is an array of publicField instances. These are the variables exposed to the user in the editor
     */
    // initialised by the child class
    public type: string;
    public subtype: string;

    public public: publicField<any>[];

    protected constructor(type: string, subtype = "") {
        this.type = type;
        this.subtype = subtype;
        this.public = [];
    }

    abstract tick (transform: Transform): void;

    // returns what is required to build it from the JSON processor
    // used especially for building the game as a html file
    abstract json (): any;

    public addPublic <T>(config: publicFieldConfig<T>): publicField<T> | void {
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
        this.public.push(field);

        Object.defineProperty(this, config.name, {
            // so you can loop over it using for ... in
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

    public getPublic (name: string): any | undefined {
        for (let field of this.public) {
            if (field.name === name) {
                return field.value;
            }
        }
        
        return undefined;
    }

    public hasPublic (name: string): boolean {
        for (let field of this.public) {
            if (field.name === name) {
                return true;
            }
        }

        return false;
    }

    public setPublic (name: string, value: any) {
        for (let field of this.public) {
            if (field.name === name) {
                field.value = value;
            }
        }
    }
    
    get sprite (): Sprite {
        Sprite.loop(sprite => {
            for (let component of sprite.components)
                if (Object.is(component, this))
                    return sprite;
        });
        
        throw `No sprite found for component ${this.type}, ${this.subtype}`;
    }
}
