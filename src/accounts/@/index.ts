let username = window.urlParam('u') || '';

document.title = username;

$('#username').html(username);

let projects = $('#projects');

window.request('public-projects', window.apiToken, {username})
    .then(async projectNames => {

        const myUsername = (await window.request('get-username', window.apiToken)).username;

        for (let projectName of projectNames) {

            projects.append(`

            <div
                class="project-button"
                onclick="window.location.href = '../../play?p=${projectName._id}'"
            >
            <div class="projectName">
                <img
                    src="../../projects/${projectName._id}/build/assets/COVER.png"
                    alt="COVER.png"
                    style="
                        width: 40px;
                        height:40px;
                        border-radius: 4px;
                        margin-right: 4px;
                        font-size: 10px;
                    "
                />
                ${projectName.name}
                </div>


                <div id="other-people-${projectName._id}"></div>
             </div>

            `);

            const editors = await window.request(`get-project-editors`, {
                project: projectName._id
            });

            const editorsHTML = () => {
                // these are just my projects, always have 'me' first
                let html = ['me'];

                let i = 0;
                for (const editor of editors) {
                    if (i > 5) {
                        html.push(`and ${editors.length-5} others`);
                        return html.join(', ');
                    }

                    if (editor.username === myUsername)
                        continue;

                    html.push(editor.username);
                    i++;
                }

                return html.join(', ');
            };

            $(`#other-people-${projectName._id}`).html(`(${editorsHTML()})`);
        }
        if (!projects.html()) {
            projects.html(`
                <div style="text-align: center">
                    Looks like this user doesn't have any projects yet!
                </div>
            `);
        }
    });