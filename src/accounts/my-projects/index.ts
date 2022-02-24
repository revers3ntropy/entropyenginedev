import {} from '../../../types/types';

mustBeSignedIn(() => {
    let myProjects = $('#my-projects');
    let sharedWithMe = $('#shared-projects');

    let apiToken: apiTok = {

    };

    request('get-project-names', apiToken).then(async projectNames => {

        const myUsername = (await request('get-username', apiToken)).username;

        for (let projectName of projectNames) {
            const isShared = projectName.level != 3;

            (!isShared ? myProjects : sharedWithMe).append(`

            <div
                class="project-button"
                onclick="window.location.href = '../../editor?p=${projectName._id}'"
            >
            <div class="projectName">
                <img
                    src="../../projects/${projectName._id}/build/assets/COVER.png"
                    alt="COVER"
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

            ${isShared ? '' :`

                <div style="background: none">
                    <a href="../delete-project?p=${projectName._id}" style="background: none">
                        delete
                    </a>
                </div>
            `}
             </div>

            `);

            const editors = await request(`get-project-editors`, {
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
        if (!myProjects.html()) {
            myProjects.html(`<div style="text-align: center">Looks like you haven't made any projects yet!</div>`);
        }

        if (!sharedWithMe.html()) {
            sharedWithMe.html(`<div style="text-align: center">Looks like no-one has shared any projects with you yet!</div>`);
        }
    });
}, () => {});