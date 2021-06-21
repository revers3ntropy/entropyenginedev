import { Sprite } from "./sprite.js";
export class publicField {
    constructor(config) {
        this.array = config.array || false;
        this.type = config.type || typeof config.value || 'string';
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
export class Component {
    constructor(type, subtype = "") {
        this.type = type;
        this.subtype = subtype;
        this.public = [];
    }
    addPublic(config) {
        if (!config.name) {
            console.error(`Public fields must have 'name' property`);
            return;
        }
        if (this.hasPublic(config.name)) {
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
            get() {
                if (config.overrideGet === undefined)
                    return this.getPublic(config.name);
                return config.overrideGet();
            },
            set(value) {
                if (config.overrideSet === undefined) {
                    this.setPublic(config.name, value);
                    return;
                }
                config.overrideSet(value);
            }
        });
        return field;
    }
    getPublic(name) {
        for (let field of this.public) {
            if (field.name === name) {
                return field.value;
            }
        }
        return undefined;
    }
    hasPublic(name) {
        for (let field of this.public) {
            if (field.name === name) {
                return true;
            }
        }
        return false;
    }
    setPublic(name, value) {
        for (let field of this.public) {
            if (field.name === name) {
                field.value = value;
            }
        }
    }
    get sprite() {
        Sprite.loop(sprite => {
            for (let component of sprite.components)
                if (Object.is(component, this))
                    return sprite;
        });
        throw `No sprite found for component ${this.type}, ${this.subtype}`;
    }
}
