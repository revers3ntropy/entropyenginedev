import {request} from '../../request.ts';
import {comment as commentComponent} from '../../globalComponents.ts';
import {apiToken, projectID} from '../state.js';

export function renderComments (div) {

	div.html(`

    <p>
    	Only editors for this project can see this. 
    	<a href="https://entropyengine.dev/play?p=${projectID}">Public Comments</a>
	</p>
	
    <p style="margin: 10px 0 50px 100px; font-size: 20px">
        <span id="num-comments"></span> Private Comments
    </p>
	
    <div id="add-comment-container">
        <label>
            <input
                type="text"
                id="add-comment"
                placeholder="Add a private comment..."
                maxlength = "500"
            />
        </label>
    </div>
    <div id="the-comments"></div>
    <footer style="height: 100px"></footer>
	`);

	function refreshComments (username) {
		request('/get-comments', apiToken, {
			public: false
		}).then(comments => {
			$('#num-comments').html(comments.length);

			if (!comments) return;

			const commentsDIV = $('#the-comments');

			commentsDIV.html('');

			for (let comment of comments) {
				let html = commentComponent(comment, comment.username === username);
				commentsDIV.append(html);

				// have to do this here
				if (comment.username !== username) continue;

				$(`#delete-comment-${comment._id}`).click(() => {

					$(`#comment-${comment._id}-menu`).hide();
					$(`#comment-${comment._id}`).hide();

					request('/delete-comment', apiToken, {
						commentID: comment._id
					}).then(() => {
						refreshComments(username);
					});
				});
			}
		});
	}

	const addMessage = $("#add-comment");

	request('/get-username', apiToken)
		.then(username => {
			addMessage.keyup(event => {
				if (event.keyCode !== 13) return;

				const content = addMessage.val();
				addMessage.val('');

				request('/comment', apiToken, {
					content,
					public: false,
				}).then(() => {
					refreshComments(username.username);
				});
			});

			refreshComments(username.username);
		});
}