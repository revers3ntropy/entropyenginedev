import {state, setSelected} from "../../state.js";
import {Scene, Entity, Transform} from "../../../entropy-engine";
import {reRender, rightClickOption, setRightClick} from "../renderer.js";
import {setRightClickAddSpriteMenu} from "./rightClickCreateMenu.js";

const _entity_ = (sprite, selected) => `
    <div style="margin: 0; padding: 0" id="sprite${sprite.id}">
        <button
            class="empty-button"
            style="
                background-color: ${selected ? 'var(--input-bg)' : 'var(--input-opposite-bg)'};
                border-bottom: 2px solid vaR(--bg);
            "
            id="spritebutton${sprite.id}"
        >
            ${sprite.name}
        </button>
        <div id="childrenOf${sprite.id}" style="padding-left: 20px">
            ${sprite.transform.children
                .map(child => _entity_(child, Object.is(state.selectedEntity, child))
            ).join('')}
        </div>
    </div>
`;

export function reRenderHierarchy () {
    const h = $('#hierarchy');

    h.html(`
        <p class="header">
            <button id="add-scene" style="font-size: 20px">+</button>
            <select id="scene-select" onchange="window.setScene()" style="font-size: 20px" class="text-box">
            </select><br>
            <button id="rename-scene">
                rename to
            </button>
            <input 
                type="text" 
                id="rename-scene-to" 
                style="
                    border-radius: 0;
                    border-bottom: 1px solid vaR(--text-colour); 
                    background: none
            ">
        </p>
    `);

    let scenes = $('#scene-select');

    for (let scene of Scene.scenes) {
        let isActive = scene.id === Scene.active;

        scenes.append(`
            <option value="${scene.id}" ${isActive? 'selected': ''}>
                ${scene.name}
            </option>
        `);
    }

    $('#add-scene').click(() => {
        Scene.create({
            name: 'New Scene'
        });
        reRender();
        window.save();
    });

    $('#rename-scene').click(() => {
        let val = $('#rename-scene-to').val();
        if (!val) return;

        Scene.activeScene.name = val;
        window.save();
        reRender();
    });

    let entities = '';
    let sceneEntities = Scene.activeScene.entities;

    for (let entity of sceneEntities){

        if (!entity.transform.isRoot()) continue;

        // so that only root nodes have <li>s around, children are just in divs
        entities += `
        <li>
            ${_entity_(entity, Object.is(state.selectedEntity, entity), h)}
        </li>
        `;
    }


    h.append(`
        <ul id="hierarchy-draggable-area">
            ${entities}
        </ul>
        <div id="create-sprite-area" style="height: 100%; max-height: 100vw"></div>
    `);

    for (let i = 0; i < sceneEntities.length; i++) {
        const sprite = sceneEntities[i];

        $(`#spritebutton${sprite.id}`).click(() => {
            // stop a new spite being selected when the menu is up and an option is clicked
            if ($('#pop-up').css('visibility') === 'visible')
                return;

            setSelected(sprite);
            reRender();
        });

        setRightClick(`spritebutton${sprite.id}`, sprite, `
            ${rightClickOption('delete', () => {
                state.selectedEntity.delete();
                for (let child of state.selectedEntity.transform.children) {
                    child.delete();
                }
                reRender();
            })}
            ${rightClickOption('duplicate', async () => {
                let clone = await state.selectedEntity.getClone();
    
                // entity (1) ==> entity (2)
                const regex = /(.*)\(([0-9]+)\)/;
                const match = clone.name.match(regex);
                if (match) {
                    const num = parseInt(match[2]) + 1;
                    clone.name = `${match[1]} (${num})`;
                }
                else
                    clone.name = `${clone.name} (1)`;
    
                Entity.entities.push(clone);
                reRender();
            })}
            ${rightClickOption('add child', async () => {
    
                Entity.newSprite({
                    name: 'New Sprite',
                    transform: new Transform({
                        parent: state.selectedEntity.transform
                    })
                });
                reRender();
            })}
        `);
    }

    $(`#create-sprite-area`).click(() => {
        setSelected(null);
        reRender();
    });

    setRightClickAddSpriteMenu('create-entity-area');
}