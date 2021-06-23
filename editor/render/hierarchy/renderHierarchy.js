import {state, setSelected} from "../../state.js";
import {Scene, Sprite, Transform} from "../../../entropy-engine";
import {reRender, rightClickOption, setRightClick} from "../renderer.js";
import {setRightClickAddSpriteMenu} from "./rightClickCreateMenu.js";

const _sprite_ = (sprite, selected) => `
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
                .map(child => _sprite_(child, Object.is(state.selectedSprite, child))
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

    let sprites = '';

    for (let i = 0; i < Scene.activeScene.sprites.length; i++) {
        const sprite = Scene.activeScene.sprites[i];

        if (!sprite.transform.isRoot()) continue;

        // so that only root nodes have <li>s around, children are just in divs
        sprites += `
        <li>
            ${_sprite_(sprite, Object.is(state.selectedSprite, sprite), h)}
        </li>
        `;
    }


    h.append(`
        <ul id="hierarchy-draggable-area">
            ${sprites}
        </ul>
        <div id="create-sprite-area" style="height: 100%"></div>
    `);


    let sceneSprites = Scene.activeScene.sprites;
    for (let i = 0; i < sceneSprites.length; i++) {
        const sprite = sceneSprites[i];

        $(`#spritebutton${sprite.id}`).click(() => {
            // stop a new spite being selected when the menu is up and an option is clicked
            if ($('#pop-up').css('visibility') === 'visible')
                return;

            setSelected(sprite);
            reRender();
        });

        setRightClick(`spritebutton${sprite.id}`, sprite, `
            ${rightClickOption('delete', () => {
                state.selectedSprite.delete();
                for (let child of state.selectedSprite.transform.children) {
                    child.delete();
                }
                reRender();
            })}
            ${rightClickOption('duplicate', async () => {
                let clone = await state.selectedSprite.getClone();
    
                // sprite (1) ==> sprite (2)
                const regex = /(.*)\(([0-9]+)\)/;
                const match = clone.name.match(regex);
                if (match) {
                    const num = parseInt(match[2]) + 1;
                    clone.name = `${match[1]} (${num})`;
                }
                else
                    clone.name = `${clone.name} (1)`;
    
                Sprite.sprites.push(clone);
                reRender();
            })}
            ${rightClickOption('add child', async () => {
    
                Sprite.newSprite({
                    name: 'New Sprite',
                    transform: new Transform({
                        parent: state.selectedSprite.transform
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

    setRightClickAddSpriteMenu('create-sprite-area');
}