console.log(window);
const toFill = $('#links');

window.validID(localStorage.id)
    .then(signedIn => {
        if (signedIn) {
            toFill.html(`
                <a href="accounts/my-projects/" style="font-size: 30px">
                    All Projects
                </a>
                `);
            recentProjects();
        } else {
            toFill.html(`
            <a href="accounts/sign-in" style="font-size: 25px; margin: 10px">
                Sign In
            </a>
            <a href="accounts/new" style="font-size: 25px">
                Create Account
            </a>
            `);

            $('#recent-projects-header').html('');
        }
    });

window.request ('top-projects-by-views', window.apiToken)
    .then(async data => {
        for (const project of data) {
            const projectID = project.id;

            const token: apiTok = {
                project: projectID,
            };

            const { name } = (await window.request('get-project-name', token));

            const owner = await window.request('project-owner', token);

            const views = await window.request('project-views', token);

            $('#top-projects').append(`
                    <div class="project" id="project-${projectID}">
                        <p style="text-align: center; font-size: 20px; margin: 2px">
                            ${name}
                        </p>
                        <div style="
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        ">
                            <img
                                src="../../projects/${projectID}/build/assets/COVER.png"
                                alt="COVER.png"
                                style="
                                    width: 130px;
                                    height: 130px;
                                    border-radius: 4px;
                                    border: 1px solid #848484;
                                    font-size: 12px;
                                "
                            />
                        </div>
                        <div style="font-size: 12px; margin: 2px">
                             By ${owner.owner} ${owner.totalContributors > 1? `
                                and ${owner.totalContributors - 1} others
                             ` : ''}
                         </div>

                        <div style="font-size: 12px; text-align: right; margin-right: 2px">
                            ${views.unique} viewers | ${views.total} views
                        </div>
                    </div>
            	`);

            $(`#project-${projectID}`).click(() => {
                window.location.href = 'https://entropyengine.dev/play?p=' + projectID;
            });
        }

        window.scrollTo(0, 0);
    });


function recentProjects () {
    window.request('get-project-names', window.apiToken)
        .then(async projectNames => {

            const projectsDiv = $('#recent-projects');

            const myUsername = (await window.request('get-username', window.apiToken)).username;

            let i = 0;
            for (let projectName of projectNames) {
                // only show 5 projects
                if (i > 4) {
                    window.scrollTo(0, 0);
                    return;
                }
                i++;

                projectsDiv.append(`
    
                    <div
                        class="project-button"
                        onclick="window.location.href = '../../editor?p=${projectName._id}'">
                        <div class="projectName">
                            <img
                                src="../../projects/${projectName._id}/build/assets/COVER.png"
                                alt="COVER"
                                style="
                                    width:40px;
                                    height:40px;
                                    border-radius: 4px;
                                    margin-right: 4px;
                                    font-size: 12px;
                                "
                            />
                            ${projectName.name}
                        </div>
    
                        <div id="other-people-${projectName._id}"></div>
    
                        <div style="font-size: 12px; text-align: right; margin-right: 2px">
                            ${window.unixTimeAgo(projectName.latest)} ago
                        </div>
                     </div>
    
                    `);

                window.apiToken.project = projectName._id;
                const editors = await window.request(`get-project-editors`);

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
            if (!projectsDiv.html()) {

                projectsDiv.html(`
                    <div style="text-align: center">
                        Looks like you haven't made any projects yet!
                    </div>
                    `);
            }

            window.scrollTo(0, 0);
        });
}
