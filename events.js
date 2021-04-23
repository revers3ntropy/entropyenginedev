import { selectedSprite } from "./index.js";
import {reRender} from "./renderer.js";
import {state} from './index.js';


window.addEventListener('click', () => {
    $('#pop-up').css('visibility', 'hidden');

    // cleans up add-component window
    // in timeout just to make sure it gets the click if you clicked on a button in the menu first
    const popup = $('.add-component-popup')
    if (!popup.length) return;
    popup.remove();
});

document.addEventListener('contextmenu', event => {
    $('#pop-up').css('visibility', 'hidden');
});

window.onPropertyChange = (id, propertyName, componentName) => {
    let value = $(`#${id}`).val();

    let component;
    if (componentName === 'transform')
        component = selectedSprite[componentName];

    else if (componentName === 'nocomponent') {
        selectedSprite[propertyName] = value;
        reRender();
        return;

    } else
        component = selectedSprite.getComponent(componentName);

    if (typeof component[propertyName] === 'boolean') {
        component[propertyName] = !component[propertyName];
        reRender();
        return;
    }

    const lastChar = id.substr(id.length - 1);

    if (['x', 'y'].includes(lastChar))
        // is a v2
        component[propertyName][lastChar] = parseFloat(value);
    else {
        if (typeof component[propertyName] === 'number')
            value = parseFloat(value);

        component[propertyName] = value;
    }

    reRender();
}
