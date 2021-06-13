import {scripts, selectedSprite, projectID} from "../../index.js";
import {JSBehaviour} from "../../../entropy-engine"; JSBehaviour;
import {reRender, rightClickOption, setRightClick} from "../renderer.js";
import {genCacheBust} from '../../../util.js';


// importing all components
import {
    Script,
    CircleCollider, RectCollider,
    Body,
    CircleRenderer, ImageRenderer2D, RectRenderer,
    GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox,
    Camera,

    v2
} from '../../../entropy-engine'; Script;


const allComponents = {
    'General': [
        Camera
    ],
    'Physics': [
        Body,
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
        CircleRenderer, RectRenderer, ImageRenderer2D,
    ],
    'Scripts': [],
};

export function reRenderInspector () {

    // div that everything is put into
    const i = $('#inspector');

    if (!selectedSprite) {
        i.html(`

        <p style="text-align: center">
            No sprite selected
        </p>
        
        `);
        return;
    }

    i.html(`
        <div class="center" style="margin-bottom: 5px">
        <!--  do the name completely seperately -->
            <input
                type="text" 
                id="input-name" 
                value="${selectedSprite.name}" 
                onchange="window.onPropertyChange('input-name', 'nocomponent', ['name'])" 
                style="
                    font-size: 20px;
                    text-align: center;
                    padding: 8px 2px;
                "
            >
        </div>
    `);

    const _componentProperty_ = (object, key, componentName, chain=[], showName=key, type=null) => {

        let showValue = '';
        let value = object[key];
        type ||= typeof value;

        const description = object.description || '';

        let defaultVal = object.default || '';
        if (typeof object.default === 'object')
            defaultVal = JSON.stringify(object.default);


        let showDefault = !!defaultVal && value !== defaultVal;

        if (object.default instanceof v2){
            defaultVal = object.default.str;
            showDefault = !object.default.equals(value);
        }


        const id = `input-${key}-${componentName}-${chain.join('-')}`;

        let argumentChain = '';
        for (let prop of chain)
            argumentChain += `'${prop}', `;
        
        switch (type) {

            case 'rgb':
                showValue = `
                    <input 
                        type="color" 
                        id="${id}" 
                        value="${value.hex}" 
                        onchange="window.onPropertyChange('${id}', '${componentName}', ['colour'])"
                    >
                `;
                break;

            case 'number':
            case 'string':
                const isNum = typeof value === 'number';

                if (key === 'url') {
                    // remove the added path for assets
                    const url = value.split('/');
                    value = url[url.length-1];
                }
                showValue = `
                    <input 
                        type="${isNum ? 'number' : 'text'}"
                        id="${id}" value="${value}"
                        onchange="window.onPropertyChange('${id}', '${componentName}', [${argumentChain} '${key}'] ${isNum? ', parseFloat' : ''})"
                    >
                `;
                
                break;
            case 'boolean':
                showValue = `
                    <input 
                        type="checkbox"
                        id="${id}" ${value ? 'checked' : ''} 
                        onchange="window.onPropertyChange('${id}', '${componentName}', [${argumentChain} '${key}'], window.parseBool)"
                        
                    >
                `;
                break;

            case 'v2':
            case 'v3':

                showValue += `
                    <div style="display: flex; justify-content: space-evenly; transform: scale(0.9)">
                `
                for (let prop in value) {
                    showValue += _componentProperty_(value, prop, componentName, [...chain, key])
                }

                showValue += '</div>';
                break;

            case 'Sprite':
                showValue += `
                    <select 
                        id="${id}" 
                        onchange="window.onPropertyChange('${id}', '${componentName}', [${argumentChain} '${key}'] ${isNum? ', parseFloat' : ''})"
                    >
                `;

                for (let sprite of Sprite.sprites) {
                    showValue += `
                        <option value="audi">Audi</option>
                    
                    `;
                }

                showValue += `
                    <selection>
                `;
                
                break;

            case 'object':
            case 'json':
                if (Array.isArray(value)) {

                    const arrayType = typeof value[0];

                    window[`addElement${id}`] = () => {
                        let defaultValue;
                        switch (arrayType) {
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

                            default:
                                if (Array.isArray(value[0])) {
                                    defaultValue = [];
                                } else {
                                    // includes strings
                                    defaultValue = '';
                                }

                        }
                        value.push(defaultValue);
                        reRender();
                    };

                    window[`removeElement${id}`] = () => {
                        object[key] = value.splice(parseInt($(`removeElementIndex${id}`).val()), 1);
                        reRender();
                    };

                    showValue = `<div id="${id}" class="array">(${value.length})`;

                    for (let i = 0; i < value.length; i++) {
                        showValue = `${showValue} <div>${_componentProperty_(value, i, i)}</div>`;
                    }


                    showValue += `
                        </div>
                        <button onclick="window['addElement${id}']()" class="empty-button" style="width: 20px; height: 20px">+</button>
                        <span style="border: 1px solid #b1b1b1; border-radius: 3px; height: 24px">
                            <input id="removeElementIndex${id}" type="number">
                            <button onclick="window['removeElement${id}']()" class="empty-button" style="width: 20px; height: 20px">-</button>
                        </span>
                    `;
                    break;
                } else {
                    for (let prop in value) {
                        showValue += _componentProperty_(value, prop, componentName, [...chain, key])
                    }
                }
                break;

            default:
                showValue = 'Sorry, that type is not supported in the editor';
        }

        return (`

    <div style="
        margin-left: 2px;
        display: grid;
        padding-bottom: 3px;
    ">
        <span style="grid-column: 1/1; font-size: 14px">
            ${showName}
        </span> 
        <span style="grid-column: 2/2; text-align: right; padding-right: 2px">
            ${showValue}
        </span>
    </div>
    
    ${!description ? '' :`
    
    <div>
        <p style="font-size: 10px; padding: 4px;">
            ${description}
        </p>
    </div>
    
    `}
    
    ${showDefault ? `
    
    <div>
        <p style="font-size: 10px">
            Default: ${defaultVal}
        </p>
    </div>
    
    `: ''}

        `);
    };

    const _component_ = (component) => {
        const cName = component.subtype || component.type;
        i.append(`
            <div id="component-${cName}">
                <p class="subheader" style="
                    background: vaR(--input-opposite-bg);
                    margin-top: 10px;
                    border-top: 1px solid vaR(--text-colour);
                    padding: 2px 0;
                ">
                    ${cName}
                </p>
            </div>
        `);

        if (cName !== 'Transform') {
            setRightClick(`component-${cName}`, selectedSprite, `
                ${rightClickOption('remove', () => {
                    let index = selectedSprite.components.indexOf(component);
                    if (index !== -1)
                        selectedSprite.components.splice(index, 1);

                    reRender();
                })}
            `);
        }

        const componentHTML = $(`#component-${cName}`);

        if (component.type === 'Transform') {
            for (let prop of [
                {key: 'localPosition', name: 'position', type: 'v3'},
                {key: 'localRotation', name: 'rotation', type: 'v3'},
                {key: 'localScale', name: 'scale', type: 'v3'},
            ]) {
                componentHTML.append(`

                    ${_componentProperty_(
                        component,
                        prop.key,
                        'transform', 
                        [],
                        prop.name,
                        prop.type
                    )}
               
                `);
            }
            return;
        }

        let j = 0;
        for (let property of component.public) {
            let name = component.type;
            if (name === 'Script') {
                name = component?.scriptName || component?.name || component.subtype;
            }
            componentHTML.append(`
                <div style="border-bottom: 1px solid vaR(--input-bg); margin-bottom: 4px">
                    ${_componentProperty_(
                        property,
                        'value',
                        name,
                        ['public', j],
                        property.name,
                        property.type
                    )}
                </div>
            `);

            j++;
        }
    };

    for (let p in selectedSprite) {
        if (!selectedSprite.hasOwnProperty(p)) continue;
        if (['components', 'transform', 'name', 'id'].includes(p)) continue;

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
    `);

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

                import(`../projects/${projectID}/scripts.js?c=${genCacheBust()}`).then (scripts => {
                    component.script = new (scripts[scriptName])();
                    component.subtype = component.script?.constructor?.name || 'noscript';
                    reRender();
                });

                // new property defined just on these Script components
                component.scriptName = scriptName;
                component.name = scriptName;
            }
            
            reRender();
        };

        const _button_ = text => (`
            <div>
                <button class='empty-button' onclick="window.addComponent(\`${text}\`)">
                    ${text}
                </button>
            </div>
        `);

        function components() {
            let html = '';
            for (let group in allComponents) {
                html += `
                    <button
                        class="empty-button" 
                        style="background-color: vaR(--input-opposite-bg)"
                    >
                       ${group}
                    </button>
                `;

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