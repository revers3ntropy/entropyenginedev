//import * as ee from '../../node_modules/entropy-engine/src';

import {comment as commentComponent} from '../../scripts/globalComponents';

apiToken.project = parseInt(urlParam('p') || '0');

const cacheBust = Math.floor(Math.random() * 10**5);

function notAvailable (data: any) {
    window.location.href = `https://entropyengine.dev/accounts/error?type=buildPlayFail&extra=${JSON.stringify(data)}`;
}

document.addEventListener('keypress', evt => evt.preventDefault());
document.addEventListener('keydown', evt => evt.preventDefault());
document.addEventListener('keyup', evt => evt.preventDefault());

request ('has-build', apiToken)
    .then (async beenBuilt => {
        if (!beenBuilt.built) {
            notAvailable(beenBuilt);
            return;
        }

        const access = await request('/get-project-access', apiToken);
        if (access.accessLevel < 1) {
            notAvailable(access);
            return;
        }

        $('#contributors-link').attr('href',  (_, v) => v + apiToken.project);

        // run the actual game - use cache-bust to get the most recent version
        //await ee.runFromJSON(`../projects/${apiToken.project}/build/index.json?cache-bust=${cacheBust}`);

        const owner = await request('project-owner', apiToken);
        if (owner.totalContributors-1 < 1) {
            $('#project-owner').html(owner.owner);
        }
        else {
            $('#project-owner').html(`
                ${owner.owner} and ${owner.totalContributors-1} others
            `);
        }

        request('viewed-project', apiToken);

        const projectViewsData = await request('/project-views', apiToken);
        $('#views').html(`
            <span style="margin-right: 10px">
                ${projectViewsData.unique} viewers
            </span>

            <span>
                ${projectViewsData.total} views
            </span>
        `);

        async function refreshComments (username: string) {
            const comments = await request('get-comments', apiToken, {
                public: true
            });
            $('#num-comments').html(comments.length);

            if (!comments) return;

            const commentsDIV = $('#comments');

            commentsDIV.html('');

            for (let comment of comments) {
                commentsDIV.append(commentComponent(comment, comment.username === username));

                // have to do this here
                if (comment.username !== username) continue;

                $(`#delete-comment-${comment._id}`).click(async () => {

                    $(`#comment-${comment._id}-menu`).hide();
                    $(`#comment-${comment._id}`).hide();

                    await request('delete-comment', apiToken, {
                        commentID: comment._id
                    });
                    refreshComments(username);
                });
            }
        }


        const addMessage = $("#add-comment");

        const username = await request('get-username', apiToken);

        addMessage.keyup(async event => {
            if (event.keyCode !== 13) return;

            const content = addMessage.val();
            addMessage.val('');

            await request('comment', apiToken, {
                content,
                public: true
            });
            refreshComments(username.username);
        });

        refreshComments(username.username);
    });