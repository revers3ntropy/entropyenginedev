import {rgb} from "../util/colour.js";
import {v2, v3} from "../maths/maths.js";
import {publicField, publicFieldConfig} from "../publicField.js";


export abstract class Component {
    /*
        subtype so you can have three-level inheritance for components, e.g. Component ==> Renderer ==> RectRenderer
        subtype is RectRenderer, type is Renderer
        as entities can only have a single of each type, can use 'getComponent(type)' without worrying about what type of that it is
        e.g. entity.getComponent('Renderer').draw()
        instead of dealing with every possible renderer

        public is an array of publicField instances. These are the variables exposed to the user in the editor
     */
    // initialised by the child class
    public type: string;
    public subtype: string;

    public public: publicField<any>[];

    protected constructor (type: string, subtype = "") {
        this.type = type;
        this.subtype = subtype;
        this.public = [];
    }

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
                    this.setPublicTypeCheck(config.name, value);
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

    public getPublicField <T>(name: string): publicField<T> | undefined {
        for (let field of this.public) {
            if (field.name === name) {
                return field;
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

    public setPublicTypeCheck (name: string, value: any) {
        if (!this.hasPublic(name)) {
            console.log(`No public variable found  with name ${name}`)
            return;
        }
        const type = typeof value;

        const current = this.getPublicField(name);

        if (current === undefined) {
            console.log(`No public variable found  with name ${name}`)
            return;
        }

        switch(current.type) {
            case 'rgb':
                if (typeof value === 'string') {
                    this.setPublic(name, rgb.parse(value));
                    break;
                }
                if (value && value?.isColour) {
                    this.setPublic(name, value);
                    break;
                }
                console.error(`Cannot set property '${name}' of type '${type}' to:`, value);
                break;

            case 'Transform':
                this.setPublic(name, value);
                break;

            case 'v2':
                if (value instanceof v2) {
                    this.setPublic(name, value);
                    break;
                }
                if (Array.isArray(value) && value.length === 2) {
                    this.setPublic(name, v2.fromArray(value));
                    break;
                }
                if (typeof value.x === 'number' && typeof value.y === 'number') {
                    this.setPublic(name, new v2(value.x, value.y));
                    break;
                }
                console.error(`Cannot set public property '${name}' of type v2 to value '${value}' of type '${type}'`)
                break;
            case 'v3':
                if (value instanceof v3) {
                    this.setPublic(name, value);
                    break;
                }
                if (Array.isArray(value) && (value.length === 3 || value.length === 4) ) {
                    this.setPublic(name, v3.fromArray(value));
                    break;
                }
                if (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
                    this.setPublic(name, new v3(value.x, value.y, value.z, value.w));
                    break;
                }
                console.error(`Cannot set public property '${name}' of type v3 to value '${value}' of type '${type}'`)
                break;

            default:
                if (type !== current.type) {
                    console.error(`Tried to set public variable '${name}' of type '${current.type}' to '${value}' of type '${type}'`)
                    return;
                }
                this.setPublic(name, value);
                break;
        }
    }
}
