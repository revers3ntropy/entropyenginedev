import {selectedSprite, setSelected} from "./index.js";
import {Sprite} from "./entropy-engine";
import {reRender, rightClickOption, setRightClick} from "./renderer.js";

export function reRenderHierarchy () {
    const h = $('#hierarchy');

    h.html(`
        <p class="header">
            Hierarchy
        </p>
    `);

    const _sprite_ = (sprite, selected, e) => {
        e.append (`
        <div style="margin: 0; padding: 0" id="sprite${sprite.id}">
            <button 
                class="empty-button"
                style="
                    background-color: ${selected ? 'rgb(200, 200, 200)' : 'rgb(240, 240, 240)'};
                    border-bottom: 1px solid #d0d0d0;
                "
                id="spritebutton${sprite.id}"
            >
                ${sprite.name}
            </button>
            <div id="childrenOf${sprite.id}" style="padding-left: 20px"></div>
        </div>
    `);

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

            console.log(clone)
            Sprite.sprites.push(clone);
            reRender();

        })}
        `);

        sprite.transform
            .getChildren()
            .map(child => _sprite_(child, Object.is(selectedSprite, child), $(`#childrenOf${sprite.id}`))
            ).join();
    }

    for (let i = 0; i < Sprite.sprites.length; i++) {
        const sprite = Sprite.sprites[i];

        if (!sprite.transform.isRoot()) continue;

        _sprite_(sprite, Object.is(selectedSprite, sprite), h);
    }

    h.append(`
        <div class="center">
            <button id="add-sprite" class="button">
                Create Empty Sprite
            </button>
        </div>
    `)

    $('#add-sprite').click(() => {
        setSelected(Sprite.newSprite({}));
        reRender();
    });
}