import {projectID, selectedSprite} from '../../index.js';
import {request} from '../../../request.js';
import {reRender, rightClickOption, setRightClick} from "../renderer.js";
import {cullString} from '../../../entropy-engine/util/util.js';

export const renderAssets = async div => {
	const projectAssets = await request('/get-assets', {
		projectID
	});
	let assetsHTML = '';
	for (const asset of projectAssets) {

		assetsHTML += `
			<div id="asset${asset.fileName}" class="asset-container">
				<div style="
					display: flex;
					justify-content: center;
					align-items: center;
					width: 150px; height: 150px;
				">
					<div class="asset-image-container">
						<div style="
							background: url(../projects/${projectID}/assets/${asset.fileName}) no-repeat center center;
							" class="asset-image">
						</div>
					</div>

				</div>
				<p style="font-size: 20px; text-align: center; margin: 5px 0">
					${cullString(asset.fileName, 10)}
				</p>

			</div>
		`;
	}

	div.html(`
		<div>
			<form action="../../../projects/upload-asset.php" method="post" enctype="multipart/form-data">
				<input type="hidden" name="projectID" value="${projectID}">
		
				Import Assets:
				<br>
				<input type="file" name="fileToUpload" id="fileToUpload">
				<br>
				<input 
					type="submit" 
					value="Upload as"
					name="submit" 
					class="button"  
					id="upload-button" 
					style="width: 30%"
				>
				<input type="text" name="assetName">.png
			</form>
		</div>
		<div style="
			overflow-y: scroll;
			display: grid;
			grid-auto-rows: auto;
			grid-gap: 1rem;
			grid-template-columns: repeat(auto-fill, 170px);
			height: 100%;
		">
		${assetsHTML}
		</div>
	`);

	// add right-click options
	for (const asset of projectAssets) {
		const file = asset.fileName;

		setRightClick(`asset${file}`, selectedSprite, `
			${rightClickOption(`delete_asset_${file}`, () => {
				request('/delete-asset', {
					projectID,
					fileName: file
				}).then(value => {
					// once it has actually been deleted, then re-render
					reRender();
				});
			}, 'delete')}`
		);
	}
};