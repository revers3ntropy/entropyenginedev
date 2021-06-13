import {request} from '../../../request.js';
import {comment as commentComponent} from '../../../globalComponents.js';
import {projectID} from '../../index.js';

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
		request('/get-comments', {
			public: false,
			projectID
		}).then(comments => {
			$('#num-comments').html(comments.length);

			if (!comments) return;

			const commentsDIV = $('#the-comments');

			commentsDIV.html('');

			for (let comment of comments) {
				commentsDIV.append(
					commentComponent(comment, comment.username === username)
				);

				// have to do this here
				if (comment.username !== username) continue;

				$(`#delete-comment-${comment._id}`).click(() => {

					$(`#comment-${comment._id}-menu`).hide();
					$(`#comment-${comment._id}`).hide();

					request('/delete-comment', {
						commentID: comment._id
					}).then(() => {
						refreshComments(username);
					});
				});
			}
		});
	}

	const addMessage = $("#add-comment");

	request('/get-username', {
		userID: localStorage.id
	}).then(username => {

		addMessage.keyup(event => {
			if (event.keyCode !== 13) return;

			const content = addMessage.val();
			addMessage.val('');

			request('/comment', {
				content,
				projectID,
				public: false,
				userID: localStorage.id
			}).then(() => {
				refreshComments(username.username);
			});
		});

		refreshComments(username.username);
	});
}