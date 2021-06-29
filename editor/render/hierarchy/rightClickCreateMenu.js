import {reRender, rightClickOption, setRightClick} from "../renderer.js";
import {setSelected, state} from "../../state.js";
import {Entity, v3} from "../../../entropy-engine";
import * as ee from "../../../entropy-engine";

export function setRightClickAddSpriteMenu(divID) {
	setRightClick(divID, state.selectedEntity, `
        <p style="
            background-color: vaR(--input-bg); 
            margin: 0; 
            padding: 2px 5px; 
            border-bottom: 1px solid vaR(--input-opposite-bg)
        ">
            Create
        </p>
        ${rightClickOption('empty', () => {
			setSelected(Entity.newSprite({}));
			reRender();
		})}
        ${rightClickOption('square', () => {
			setSelected(Entity.newSprite({
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
			setSelected(Entity.newSprite({
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
			setSelected(Entity.newSprite({
				name: 'camera',
				components: [
					new ee.Camera({}),
				]
			}));
			reRender();
		})}
        
        ${rightClickOption('cube', () => {
			setSelected(Entity.newSprite({
				name: 'cube',
				components: [
					new ee.MeshRenderer({
						mesh: ee.MeshV3.cube
					}),
				]
			}));
			reRender();
		})}
    `);
}