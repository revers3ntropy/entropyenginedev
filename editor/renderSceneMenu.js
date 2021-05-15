import {sceneCamera} from './index.js';

export function renderSceneMenu (div) {
	const cameraZoom = sceneCamera.getComponent('Camera').zoom.toFixed(2);
	const cameraPos = sceneCamera.transform.position;
	const worldSpacePos = $('#world-space-pos').text() || '0, 0';
	const screenSpacePos = $('#screen-space-pos').text() || '0, 0';

	div.html(`
		<style>
			.scene-toolbar-info {
				background-color: vaR(--input-bg); 
				border-radius: 5px;
				margin: 4px;
				padding: 3px;
			}
		</style>
		<div>
			World Space:
			<span id="world-space-pos" class="scene-toolbar-info">
			 	${worldSpacePos}
			</span>
		</div>
		
		<div>
			Screen Space:
			<span id="screen-space-pos" class="scene-toolbar-info">
			 	${screenSpacePos}
			</span>
		</div>
			
		<div>
			Zoom:
			<span id="scene-camera-zoom" class="scene-toolbar-info">
				${cameraZoom}
			</span>
		</div>
		
		<div>
			Camera Pos:
			<span id="scene-camera-pos" class="scene-toolbar-info">
				${cameraPos.x.toFixed(2)} | ${cameraPos.y.toFixed(2)}
			</span>
		</div>
	`);
}