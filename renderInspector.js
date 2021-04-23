import {scripts, selectedSprite} from "./index.js";
import {v2, JSBehaviour} from "./entropy-engine";
import {reRender, rightClickOption, setRightClick} from "./renderer.js";
JSBehaviour;
// importing all components
import {
    Script,
    CircleCollider, RectCollider,
    Body, PhysicsMaterial,
    CircleRenderer, ImageRenderer, RectRenderer,
    GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox,
    Camera
} from './entropy-engine'
Script;

const allComponents = {
    'General': [
        Camera
    ],
    'Physics': [
        Body, PhysicsMaterial,
        CircleCollider, RectCollider,
    ],
    'GUI': [
        GUIBox,
        GUIText,
        GUITextBox,
        GUIRect,
        GUICircle,
        GUIPolygon,
        GUIImage,

    ],
    'Renderers': [
        CircleRenderer, RectRenderer, ImageRenderer,
    ],
    'Scripts': [],
}

export function reRenderInspector () {
    const i = $('#inspector');

    i.html(`
        <div class="center" style="margin-bottom: 5px">
        <!--  do the name completely seperately -->
            <input 
                type="text" 
                id="input-name" 
                value="${selectedSprite.name}" 
                onchange="window.onPropertyChange('input-name', 'name', 'nocomponent')" 
                style="
                    font-size: 20px;
                    text-align: center;
                    padding: 8px 2px;
                "
            >
        </div>
    `);

    const _componentProperty_ = (object, key, componentName, showName=key) => {
        let showValue = '';
        const value = object[key];
        const id = `input-${key}-${componentName}`;
        const onChange = `onchange="window.onPropertyChange('${id}', '${key}', '${componentName}')`

        switch (typeof value) {
            case 'number':
            case 'string':
                if (key === 'colour')
                    showValue = `<input type="color" id="${id}" value="${value}" ${onChange}">`;
                else
                    showValue = `<input type="${typeof value === 'number' ? 'number' : 'text'}" id="${id}" value="${value}" ${onChange}">`;
                break;
            case 'boolean':
                showValue = `<input type="checkbox" id="${id}" ${value ? 'checked' : ''} ${onChange}">`
                break;

            default: {
                if (value instanceof v2) {
                    showValue = `
                        X: <input type="number" id="${id}-x" value="${value.x}" onchange="window.onPropertyChange('${id}-x', '${key}', '${componentName}')">
                        Y: <input type="number" id="${id}-y" value="${value.y}" onchange="window.onPropertyChange('${id}-y', '${key}', '${componentName}')">
                    `
                } else if (value instanceof PhysicsMaterial) {
                    // sort out physics materials
                    showValue = 'physics material';
                } else if (Array.isArray(value)) {

                    const arrayType = typeof value[0];

                    window[`addElement${id}`] = () => {
                        let defaultValue;
                        switch (arrayType) {
                            case "bigint":
                                defaultValue = BigInt(0);
                                break;
                            case "number":
                                defaultValue = 0;
                                break;
                            case "boolean":
                                defaultValue = false;
                                break;
                            case "object":
                                // deals with v2 and any other objects that it can throw its way
                                defaultValue = new (eval(value[0].constructor.name))();
                                break;
                            case "function":
                                defaultValue = `'Function[]' is not supported`;
                                break;

                            default: {
                                if (Array.isArray(value[0])) {
                                    defaultValue = [];
                                    break;
                                }
                                // includes strings
                                defaultValue = '';
                                break;
                            }

                        }
                        value.push(defaultValue);
                        console.log(value);
                        reRender();
                    }

                    window[`removeElement${id}`] = () => {
                        object[key] = value.splice(parseInt($(`removeElementIndex${id}`).val()), 1);
                        reRender();
                    }

                    showValue = `<div id="${id}" class="array">(${value.length})`;

                    for (let i = 0; i < value.length; i++)
                        showValue = `${showValue} <div>${_componentProperty_(value, i, i)}</div>`;


                    showValue += `
                        </div>
                        <button onclick="window['addElement${id}']()" class="empty-button" style="width: 20px; height: 20px">+</button>
                        <span style="border: 1px solid #b1b1b1; border-radius: 3px; height: 24px">
                            <input id="removeElementIndex${id}" type="number">
                            <button onclick="window['removeElement${id}']()" class="empty-button" style="width: 20px; height: 20px">-</button>
                        </span>
                    `;
                    break;
                }
            }
        }

        return (`
            <div style="
                margin-left: 2px;
                display: grid;
                padding-bottom: 3px;
            ">
                <span style="grid-column: 1/1">
                    ${showName}:
                </span> 
                <span style="grid-column: 2/2; text-align: right; padding-right: 2px">
                    ${showValue}
                </span>
            </div>
        `);
    }

    const _component_ = (component) => {
        const cName = component.subtype || component.type;
        i.append(`
            <div id="component-${cName}" style="
                border-bottom: 1px solid grey;
                padding-bottom: 5px;
            ">
                <p class="subheader" style="
                    background: rgb(220, 220, 220);
                    margin-top: 10px;
                ">
                    ${cName}
                </p>
            </div>
        `);

        if (cName !== 'Transform') {
            setRightClick(`component-${cName}`, selectedSprite, `
                ${rightClickOption('remove', () => {
                let index = selectedSprite.components.indexOf(component);
                if (index !== -1) {
                    selectedSprite.components.splice(index, 1);
                }
                reRender();
            })}
            `);
        }

        const componentHTML = $(`#component-${cName}`);

        if (component.type === 'Transform') {
            componentHTML.append(_componentProperty_(component, 'localPosition', 'transform', 'position'));
            componentHTML.append(_componentProperty_(component, 'localRotation', 'transform', 'rotation'));
            componentHTML.append(_componentProperty_(component, 'localScale', 'transform', 'scale'));
            return;
        }

        for (let property in component) {
            if (!component.hasOwnProperty(property)) continue;
            if (['type', 'subtype', 'hasSubType'].includes(property)) continue;

            let name = component.type;
            console.log(name);
            if (name === 'Script')
                name = component?.scriptName ?? component.subtype;

            componentHTML.append(_componentProperty_(component, property, name));
        }
    }

    for (let p in selectedSprite) {
        if (!selectedSprite.hasOwnProperty(p)) continue;
        if (['components', 'transform', 'name'].includes(p)) continue;
        i.append(_componentProperty_(selectedSprite, p, 'nocomponent'));
    }

    for (let c of [selectedSprite.transform, ...selectedSprite.components])
        _component_(c, i);

    i.append(`
        <div id="add-component-wrapper">
            <div class="center">           
                <button id="add-component" class="button">
                    New Component
                </button>
            </div>
        </div>
    `)

    // add component button functionality
    $('#add-component').click(() => {

        if ($('.add-component-popup').length) return;

        window.addComponent = type => {
            type = type.split(':');

            // normal
            if (type.length === 1)
                selectedSprite.addComponent(new (eval(type[0]))({}));

            // scripts
            else if (type[0] === 'Script') {
                // slice off the surrounding ''
                const scriptName = type[1].slice(2, type[1].length-1);
                const component = new Script({});
                selectedSprite.addComponent(component);

                // new property defined just on these Script components
                component.scriptName = scriptName;
            }
            reRender();
        }

        const _button_ = text => (`
            <div>
                <button class='empty-button' onclick="window.addComponent(\`${text}\`)">
                    ${text}
                </button>
            </div>
        `)

        function components() {
            let html = '';
            for (let group in allComponents) {
                html += `
                    <button 
                        class="empty-button" 
                        style="background-color: var(--input-opposite-bg);"
                        onclick="console.log('closed')"
                    >
                       ${group}
                    </button>
                `

                if (group === 'Scripts') {
                    for (let name in scripts)
                        html += _button_(`Script: '${name}'`);
                    continue;
                }

                for (let name of allComponents[group]) {
                    let instance = new (name)({});
                    html += _button_(instance.constructor.name);
                }
            }

            return html;
        }

        setTimeout(() => {
            // timeout to make sure it actually appears, as it is first removed
            $('#add-component-wrapper').append(`
            <div style="width: 100%; display: flex; justify-content: center">
                <div class="add-component-popup">
                    ${components()}
                </div>
            </div>

            `);
            // show the whole add component menu
            let objDiv = document.getElementById("inspector");
            objDiv.scrollTop = objDiv.scrollHeight;
        }, 5);

    });
}