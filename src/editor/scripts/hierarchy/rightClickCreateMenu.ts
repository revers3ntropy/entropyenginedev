import {reRender, rightClickOption, setRightClick} from "../renderer.js";
import {setSelected, state} from "../state.js";
import {Entity, v3} from "../entropy-engine/src";
import * as ee from "../entropy-engine/src";

export function setRightClickAddEntityMenu(divID) {
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
			setSelected(Entity.newEntity({}));
			reRender();
		})}
        ${rightClickOption('square', () => {
			setSelected(Entity.newEntity({
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
			setSelected(Entity.newEntity({
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
			setSelected(Entity.newEntity({
				name: 'camera',
				components: [
					new ee.Camera({}),
				]
			}));
			reRender();
		})}
        
        ${rightClickOption('cube', () => {
			setSelected(Entity.newEntity({
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