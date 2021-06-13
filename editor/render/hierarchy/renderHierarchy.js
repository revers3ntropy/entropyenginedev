import {selectedSprite, setSelected} from "../../index.js";
import {v2, v3, Scene, Sprite} from "../../../entropy-engine";
import * as ee from '../../../entropy-engine';
import {reRender, rightClickOption, setRightClick} from "../renderer.js";

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

    const _sprite_ = (sprite, selected) => (`
        <li>
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
                    ${sprite.transform.getChildren()
                        .map(child => _sprite_(child, Object.is(selectedSprite, child))
                    ).join('')}
                </div>
            </div>
        </li>
    `);

    let sprites = '';

    for (let i = 0; i < Scene.activeScene.sprites.length; i++) {
        const sprite = Scene.activeScene.sprites[i];

        if (!sprite.transform.isRoot()) continue;

        sprites += _sprite_(sprite, Object.is(selectedSprite, sprite), h);
    }


    h.append(`
        <ul id="hierarchy-draggable-area">
            ${sprites}
        </ul>
        <div id="create-sprite-area" style="height: 100%"></div>
    `);


    for (let i = 0; i < Scene.activeScene.sprites.length; i++) {
        const sprite = Scene.activeScene.sprites[i];
        $(`#sprite${sprite.id}`).click(() => {
            // stop a new spite being selected when the menu is up and an option is clicked
            if ($('#pop-up').css('visibility') === 'visible') return;

            setSelected(sprite);
            reRender();
        });

        setRightClick(`spritebutton${sprite.id}`, sprite, `
            ${rightClickOption('delete', () => {
            selectedSprite.delete();
            reRender();
        })}
            ${rightClickOption('duplicate', async () => {
            let clone = await selectedSprite.getClone();

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
        `);
    }

    const sortableArea = $('#hierarchy-draggable-area');
    sortableArea.sortable();
    sortableArea.disableSelection();

    // create sprite options on teh hierarchy
    setRightClick('create-sprite-area', selectedSprite, `
        <p style="
            background-color: vaR(--input-bg); 
            margin: 0; 
            padding: 2px 5px; 
            border-bottom: 1px solid vaR(--input-opposite-bg)
        ">
            Create
        </p>
        ${rightClickOption('empty', () => {
            setSelected(Sprite.newSprite({}));
            reRender();
        })}
        ${rightClickOption('square', () => {
            setSelected(Sprite.newSprite({
                name: 'square',
                transform: new ee.Transform({
                    scale: new v3(100, 100, 100)
                }),
                components: [
                    new ee.RectRenderer({}),
                    new ee.RectCollider({})
                ]
            }));
            reRender();
        })}
        ${rightClickOption('circle', () => {
            setSelected(Sprite.newSprite({
                name: 'circle',
                transform: new ee.Transform({
                    scale: new v3(50, 1, 1)
                }),
                components: [
                    new ee.CircleRenderer({}),
                    new ee.CircleCollider({})
                ]
            }));
            reRender();
        })}
        ${rightClickOption('camera', () => {
            setSelected(Sprite.newSprite({
                name: 'camera',
                components: [
                    new ee.Camera({}),
                ]
            }));
            reRender();
        })}
    `);
}