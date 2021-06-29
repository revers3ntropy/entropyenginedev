import {scripts, state, projectID} from "../../state.js";
import {JSBehaviour} from "../../../entropy-engine"; JSBehaviour;
import {reRender} from "../renderer.js";
import {genCacheBust} from '../../../util.js';

import {_componentProperty_} from "./property.js";
import {_component_} from "./component.js";

// importing all components
import {
    Script,
    CircleCollider, RectCollider,
    Body,
    CircleRenderer, ImageRenderer2D, RectRenderer,
    GUIBox, GUICircle, GUIImage, GUIPolygon, GUIRect, GUIText, GUITextBox,
    Camera
} from '../../../entropy-engine';Script;


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

    if (!state.selectedEntity) {
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
                value="${state.selectedEntity.name}" 
                onchange="window.onPropertyChange('input-name', 'nocomponent', ['name'])" 
                style="
                    font-size: 20px;
                    text-align: center;
                    padding: 8px 2px;
                "
            >
        </div>
    `);

    for (let p in state.selectedEntity) {
        if (!state.selectedEntity.hasOwnProperty(p)) continue;
        if (['components', 'transform', 'name', 'id'].includes(p)) continue;

        i.append(_componentProperty_(state.selectedEntity, p, 'nocomponent'));
    }

    for (let c of [state.selectedEntity.transform, ...state.selectedEntity.components])
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
                state.selectedEntity.addComponent(new (eval(type[0]))({}));

            // scripts
            else if (type[0] === 'Script') {
                // slice off the surrounding ''
                const scriptName = type[1].slice(2, type[1].length-1);
                const component = new Script({});
                state.selectedEntity.addComponent(component);

                import(`../../../projects/${projectID}/scripts.js?c=${genCacheBust()}`)
                    .then (scripts => {
                        component.script = new (scripts[scriptName])();
                        component.subtype = component.script?.constructor?.name || scriptName;
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