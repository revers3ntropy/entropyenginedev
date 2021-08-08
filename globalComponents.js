/*
Common bits of HTML that I want to use in lots of different places.

Only use CSS inline and from global.css

 */
import {secondsToReadable} from './util.js';

export const comment = (data, canDelete =false, options=true) => `
	
<div id="comment-${data._id}-menu" style="
	width: 160px;
	background-color: rgba(180, 180, 180, 0.8);
	text-align: center;
	border-radius: 6px;
	padding: 8px 0;
	position: absolute;
	z-index: 1;
	display: none;
">
	${canDelete ? `
	<button id="delete-comment-${data._id}" style="padding: 0; width: 100%; background-color: transparent">
		Delete 🗑️
	</button><br>
	` : ''}
	<a href="https://entropyengine.dev/report?type=comment&id=${data._id}" style="padding: 0; width: 100%; background-color: transparent">
		Report ⚠️
	</a>
</div>

<div id="comment-${data._id}" style="
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid vaR(--input-bg);
">
	<p style="margin: 8px">
		${data.content}
	</p>
	<aside style="min-width: 200px; margin-left: 20px">
		<span style="margin-right: 10px">${data.username}</span>
		<span>
			${secondsToReadable(
				Math.round(
					new Date().getTime() / 1000
				) - data.date
			)} ago
		</span>
		
		${!options ? '' : `
		<button id="comment-${data._id}-menu-toggle" style="
			position: relative;
			display: inline-block;
			cursor: pointer;
			background: url(https://entropyengine.dev/svg/menu-dots.svg) no-repeat center center;
            background-size: contain;
            width: 20px; height: 15px;
		">
		`}
		</button>
	</aside>
</div>

${!options ? '' : `
<script>
(function () {
	const menu = $('#comment-${data._id}-menu');
	const menuButton = $('#comment-${data._id}-menu-toggle');
	const both = $('#comment-${data._id}-menu, #comment-${data._id}-menu-toggle');

	$(document).on('click', clickPosition => {
		if (!both.is(clickPosition.target) && menu.has(clickPosition.target).length === 0){
			menu.hide();
		} else {
			if (menuButton.is(clickPosition.target) && menu.css('display') !== 'none'){
				menu.hide();
				return;
			}
			
			if (!menu.is(clickPosition.target)){
				menu.css({
					'top': clickPosition.pageY,
					'left': clickPosition.pageX - 150
				});
			}
		
			menu.show();
		}
	});

})();
</script>
`}

`;