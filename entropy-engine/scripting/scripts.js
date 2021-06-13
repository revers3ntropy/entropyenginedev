import { publicField } from '../ECS/component.js';
import { loopThroughScripts } from "../util/util.js";
import { Script } from '../ECS/components/scriptComponent.js';
export class JSBehaviour {
    constructor() {
        this.tempPublic = [];
        this.started = false;
    }
    get public() {
        var _a;
        return ((_a = this === null || this === void 0 ? void 0 : this.component) === null || _a === void 0 ? void 0 : _a.public) || [];
    }
    // these are not used internally, but by the user when creating scripts
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
        this.tempPublic.push(field);
        Object.defineProperty(this, config.name, {
            // so you can loop over it
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
        var _a;
        if (this.started)
            return (_a = this.component) === null || _a === void 0 ? void 0 : _a.getPublic(name);
        for (let field of this.tempPublic) {
            if (field.name === name) {
                return field.value;
            }
        }
    }
    setPublic(name, value) {
        var _a;
        if (this.started)
            return (_a = this.component) === null || _a === void 0 ? void 0 : _a.setPublic(name, value);
        for (let field of this.tempPublic) {
            if (field.name === name) {
                field.value = value;
            }
        }
    }
    hasPublic(name) {
        var _a;
        if (this.started)
            return !!((_a = this.component) === null || _a === void 0 ? void 0 : _a.hasPublic(name));
        for (let field of this.public) {
            if (field.name === name) {
                return true;
            }
        }
        return false;
    }
    Start_(sprite) {
        // assign properties from a Sprite instance to be accessible by 'this' in scripts
        this.sprite = sprite;
        this.name = sprite.name;
        this.transform = sprite.transform;
        let thisComponent = null;
        loopThroughScripts((script, sprite) => {
            if (Object.is(this, script.script))
                thisComponent = script;
        });
        if (!(thisComponent instanceof Script))
            throw `Cannot find self on script with name ${this.name}!`;
        this.component = thisComponent;
        this.started = true;
    }
}
