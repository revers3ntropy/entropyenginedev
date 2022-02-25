const query = require('./sql').query,
    {clean} = require("./util"),
    fs = require('fs'),
    path = require('path'),
    fse = require('fs-extra'),
    mv = require('mv'),
    util = require('./util.js'),
    formidable = require('formidable');

require('dotenv').config();

const idMax = parseInt(process.env.SEC_IDMAX);

exports.share = ({token, res, body}) => {

    if (!body.username) {
        // share project globally
        query(`UPDATE projects SET globalAccess=${clean(body.accessLevel)} WHERE _id=${clean(token.project)}`);
        res.end("{}");
        return;
    }
    exports.authLevel(token.user, token.project, authorisation => {
        if (authorisation < 1) {
            res.end(JSON.stringify({error: 'authorisation'}));
            return;
        }
        query(`SELECT _id FROM users WHERE username='${clean(body.username)}'`, user => {
            const userID = user[0]._id;

            query(`SELECT *
               FROM projectAccess,users
               WHERE users._id = projectAccess.userID
                 AND projectAccess.userID = ${clean(userID)}
                 AND projectAccess.projectID = ${clean(token.project)}
            `, values => {

                if (values.length > 0) {
                    query(`
                        UPDATE projectAccess
                        SET projectAccess.level=${clean(body.accessLevel)}
                        WHERE projectAccess.projectID = ${clean(token.project)}
                          AND projectAccess.userID = ${clean(userID)}
                    `);
                } else {
                    query(`
                        INSERT INTO projectAccess
                        VALUES (${clean(userID)}, ${clean(token.project)}, ${clean(body.accessLevel)})
                `);
                }

                res.end(JSON.stringify({error: false}));
            });
        });
    });
};

exports.authLevel = (userID, projectID, cb) => {
    query(`SELECT globalAccess from projects WHERE _id=${clean(projectID)}`, globalAccess => {
        query(`SELECT level FROM projectAccess WHERE projectID=${clean(projectID)} AND userID=${clean(userID)}`, personalAccess => {
            query(`SELECT level FROM users WHERE _id=${clean(userID)}`, adminLevel => {
                const personal = personalAccess[0]?.level || 0;
                const global = globalAccess[0]?.globalAccess || 0;
                const admin = adminLevel[0]?.level || 0;

                let actualLevel = Math.max(personal, global, admin);

                let type = 'personal';
                if (global >= personal)
                    type = 'global';
                if ((admin > personal && type === 'personal') || (admin > global && type === 'global'))
                    type = 'admin';

                cb(actualLevel, type);
            });
        });
    });
};

exports.createProject = ({res, body, token}) => {
    query(`

        SELECT 
               FLOOR (1 + RAND() * ${clean(idMax)}) AS value 
        FROM 
             projects
        HAVING 
            value NOT IN (
               SELECT 
                   DISTINCT _id 
               FROM 
                    projects
            )
        LIMIT 1
        
    `, value => {
        const id = value[0]?.value ||
            // defaults to random number which is most likely not going to be used yet
            Math.ceil(Math.random() * idMax);
        token.project = id;

        // got the id, now do the same thing for the salt
        query(`

            INSERT INTO projects VALUES (${clean(id)}, '${clean(body.name)}', 0, 0);
            INSERT INTO projectSaves VALUES (${clean(token.user)}, ${clean(id)}, CURRENT_TIMESTAMP);
           
       `);

        res.end(JSON.stringify({
            projectID: id
        }));

        const dir = `../projects/${id}`;

        fs.mkdirSync(dir);
        fs.mkdirSync(dir + '/assets');

        fs.copyFile('../templates/project.txt', dir + '/index.json', err => {
            if (err)
                console.error(`Creating JSON file in ${dir} failed: ${err}`);
        });

        fs.copyFile('../templates/globalState.txt', dir + '/globalState.json', err => {
            if (err)
                console.error(`Creating globalState.json file in ${dir} failed: ${err}`);
        });

        query(`
            INSERT INTO projectAccess VALUES (${clean(token.user)}, ${clean(token.project)}, 3);
            INSERT INTO projectSaves VALUES (${clean(token.user)}, ${clean(token.project)}, CURRENT_TIMESTAMP);
        `);

    });
};

exports.deleteProject = ({token, res}) => {
    /**
     * Checks if the user is allowed to perform that action,
     * and if they are then deletes all data associated with the project
     *
     * Requires the userAccess.level to be at 2 or more
     */
    query(`SELECT level FROM projectAccess WHERE userID=${clean(token.user)}`, value => {
        const userLevel = value[0]?.level || 0;
        if (userLevel < 2) {
            res.end(JSON.stringify({
                ok: false
            }));
            return;
        }

        // delete files
        const dir = `../projects/${token.project}`;
        fs.rmdirSync(dir, { recursive: true });

        //  actual deletion:
        // delete rows in SQL database
        query(`

        DELETE FROM projects WHERE _id=${clean(token.project)};
        DELETE FROM projectAccess WHERE projectID=${clean(token.project)};
        DELETE FROM comments WHERE projectID=${clean(token.project)};
        DELETE FROM projectSaves WHERE projectID=${clean(token.project)};
        DELETE FROM projectViews WHERE projectID=${clean(token.project)};
        DELETE FROM reports WHERE issueID=${clean(token.project)} AND type="project";

        `, () => {
            res.end(JSON.stringify({
                ok: true
            }));
        });
    });

};

exports.publicProjectsFromUser = ({res, body}) => {
    query(`
        SELECT
            projects.name,
            projects._id,
            UNIX_TIMESTAMP(MAX(projectSaves.date)) as latest
        
        FROM
            projects,
            projectAccess,
            projectSaves,
            users
        
        WHERE
                projectAccess.projectID = projects._id
            AND
                projectSaves.projectID = projects._id
            AND
                projectSaves.projectID = projectAccess.projectID
            AND
                (projectAccess.level > 0 OR projects.globalAccess > 0)
            AND 
                users.username = '${clean(body.username)}'
        
        GROUP BY 
            projects.name, 
            projects._id, 
            projectAccess.level
        
        ORDER BY
             latest DESC

    `, values => {
        res.end(JSON.stringify(values));
    });
};

exports.getUserProjectNames = ({token, res}) => {
    query(`
        SELECT
            projects.name,
            projects._id,
            projectAccess.level,
            UNIX_TIMESTAMP(MAX(projectSaves.date)) as latest
        
        FROM
            projects,
            projectAccess,
            projectSaves
        
        WHERE
            projectAccess.projectID = projects._id
          AND
            projectSaves.projectID = projects._id
          AND
            projectSaves.projectID = projectAccess.projectID
          AND
            projectAccess.userID = ${clean(token.user)}
          AND
            projectAccess.level > 0
              
        
        GROUP BY 
             projects.name, 
             projects._id, 
             projectAccess.level
        
        ORDER BY
             latest DESC

    `, values => {
        res.end(JSON.stringify(values));
    });
};

exports.getProjectEditors = ({token, res}) => {
    query(`
        SELECT users.username
        FROM projectAccess, users
        WHERE 
            projectAccess.userID=users._id AND
            projectAccess.projectID=${clean(token.project)}
    `, values => {
        res.end(JSON.stringify(values));
    });
};

exports.save = ({token, res, body}) => {
    const dir = `../projects/${token.project}`;

    fs.writeFileSync(dir + '/index.json', body.json);

    for (let script of body.scripts) {
        fs.writeFileSync(script.path, script.text);
    }

    query(`INSERT INTO projectSaves VALUES(${clean(token.user)}, ${clean(token.project)}, CURRENT_TIMESTAMP)`, () => {
        res.end(`{"result": "true"}`);
    });
};

exports.accessLevel = ({token, res}) => {
    exports.authLevel(token.user, token.project, (accessLevel, type) => {
        res.end(JSON.stringify({
            type, accessLevel
        }));
    });
};

exports.getName = ({res, token}) => {
    query(`SELECT name FROM projects WHERE _id=${clean(token.project)}`, value => {
        res.end(JSON.stringify({
            name: value[0]?.name || 'unknown'
        }));
    });
};

const buildHTML = (htmlTitle, projectID) => {
    let raw = fs.readFileSync('../templates/buildHTML.txt');
    raw = raw.toString();
    raw = raw.replace(/ID/, projectID);
    raw = raw.replace(/TITLE/, htmlTitle);
    return raw;
};

exports.build = ({token, res}) => {
    const projectDir = `../projects/${clean(token.project)}`;
    const buildDir = projectDir + '/build';

    if (!fs.existsSync(buildDir)) {
        // create build folder
        fs.mkdirSync(buildDir);
        fs.mkdirSync(buildDir + '/assets');
        fs.appendFile(
            buildDir + '/index.html',
            '',
            () => {});
    }

    // copy scripts and json
    fs.copyFile(projectDir + '/scripts.js', buildDir + '/scripts.js', () => {});
    fs.copyFile(projectDir + '/index.json', buildDir + '/index.json', () => {});
    fs.copyFile(projectDir + '/globalState.json', buildDir + '/globalState.json', () => {});

    // copy assets
    fse.copy(projectDir + '/assets', buildDir + '/assets', { overwrite: true });

    fs.writeFileSync(
        buildDir + '/index.html',
        buildHTML('Entropy Engine', clean(token.project))
    );

    query(`
    
    UPDATE projects
    SET projects.hasBuild = 1
    WHERE projects._id = ${clean(token.project)}
    
    `, () => {
        res.end("{}");
    });
};


exports.getAssets = ({token, res}) => {
    const dir = `../projects/${clean(token.project)}/assets`;
    const files = [];

    for (const fileName of fs.readdirSync(dir)) {
        files.push({
            fileName,
        });
    }

    res.end(JSON.stringify(files));
};

exports.deleteAsset = ({token, res, body}) => {
    const path = `../projects/${clean(token.project)}/assets/${body.fileName}`;
    fs.unlinkSync(path);
    res.end("{}");
};

exports.beenBuilt = ({token, res}) => {
    let built = false;

    if (fs.existsSync(`../projects/${clean(token.project)}/build/assets`)) {
        built = true;
    }

    res.end(JSON.stringify({built}));
};

exports.contributorInfo = ({token, res}) => {
    // get a table with columns:
    //  username - username
    //  count - number of saves
    //  latest - most recent save
    exports.authLevel(token.user, token.project, auth => {
        if (auth < 1) {
            res.end(JSON.stringify([]));
            return;
        }

        query(`
            SELECT 
                   t1.username as username, 
                   t1.count as count,
                   UNIX_TIMESTAMP(MAX(projectSaves.date)) as latest
            from 
                 (SELECT 
                     users.username,
                     users._id, 
                     count(*) as count 
                 from 
                      projectSaves, 
                      users 
                 WHERE 
                       users._id = projectSaves.userID 
                   AND projectSaves.projectID = ${clean(token.project)}
                 group by 
                          projectSaves.userId,
                          users.username
                 ) as t1,
                 projectSaves 
            where
                  t1._id = projectSaves.userID
            group by
                 t1.username,
                 t1.count
            order by count desc

        `, value => {
            res.end(JSON.stringify(value));
        });
    });

};

exports.latestContributor = ({token, res}) => {
    query(`
        SELECT 
            users.username,
            UNIX_TIMESTAMP(projectSaves.date) as date
        FROM 
            users,
            projectSaves
        WHERE
              users._id = projectSaves.userID
          AND projectSaves.projectID = ${clean(token.project)}
        ORDER BY 
                 projectSaves.date 
                 DESC 
        LIMIT 1
    `, value => {
        res.end(JSON.stringify(value));
    });
};

exports.allContributors = ({url, res, body}) => {
    query(`
    
    SELECT
           users.username,
           UNIX_TIMESTAMP(projectSaves.date) as date
    FROM
         users,
         projectSaves
    WHERE
        users._id=projectSaves.userID
    AND projectID=${clean(body?.projectID || url[1])}
    
    `, data => {
        res.end(JSON.stringify(data));
    });
};

exports.projectOwner = ({token, res}) => {
    query(`
    
    SELECT
        users.username
    FROM
        users, projectAccess, projects
    WHERE 
          users._id=projectAccess.userID
        AND projectAccess.projectID=projects._id
        AND projects._id=${clean(token.project)}
        AND projectAccess.level>=3
    
    LIMIT 1
    
    `, data => {

        query(`
        
        SELECT COUNT(distinct userID) as count
        FROM projectSaves
        WHERE projectID=${clean(token.project)}
        
        `, total => {

            res.end(JSON.stringify({
                owner: data[0]?.username,
                totalContributors: total[0].count
            }));
        });
    });
};

exports.viewed = ({token, res}) => {
    query(`
    INSERT INTO projectViews
    VALUES (${clean(token.user)}, ${clean(token.project)}, CURRENT_TIMESTAMP)
    `, () => {
        res.end("{}");
    });
};

exports.projectViews = ({token, res}) => {
    query(`
    SELECT COUNT(distinct userID) as count
    FROM projectViews
    WHERE projectID=${clean(token.project)}
    `, unique => {

        query(`
        SELECT COUNT(*) as count
        FROM projectViews
        WHERE projectID=${clean(token.project)}
        `, total => {

            res.end(JSON.stringify({
                unique: unique[0].count,
                total: total[0].count
            }));

        });
    });
};

exports.topProjectViews = ({res}) => {
    // no input required - same for all users, doesn't need to be signed in
    query(`

    SELECT
        projects._id as id,
        COUNT(distinct projectViews.userID) as views
    FROM
        projectViews,
        projects
    WHERE
        projectViews.projectID = projects._id
    AND projects.globalAccess > 0
    AND projects.hasBuild
    GROUP BY
        id
    ORDER BY
        views DESC
    
    `, data => {
        res.end(JSON.stringify(data));
    });
};


exports.updateGlobalState = ({res, body, token}) => {
    let path;

    if (body.isBuild)
        path = `../projects/${clean(token.project)}/build/globalState.json`;
    else
        path = `../projects/${clean(token.project)}/globalState.json`;


    const file = fs.readFileSync(path);
    const data = JSON.parse(file);

    data[body.name] = body.replace;

    fs.writeFileSync(path, data);

    res.end("{}");
};

exports.upload = async ({url, req, res}) => {

    url.shift();

    const projectID = url.shift();
    const from = url.shift();
    const path = url.join('/') || '';

    const assetsPath = `../projects/${clean(projectID)}/assets`;
    util.folderSize(assetsPath, ({gb, mb}) => {
        if (gb > 1) {
            res.end(`

                <p style="text-align: center; font-size: xx-large">
                    Looks like you've ran out of space! You have used ${mb} / 1000 MB!
                </p>
                
                <a href="https://entropyengine.dev/editor?p=${projectID}&from=${from}">
                    back
                </a>
                
            `);
            return;
        }
        const form = new formidable.IncomingForm();

        form.parse(req, (err, fields, files) => {

            const file = files.filetoupload;

            const oldPath = file.path;
            const newPath = `${assetsPath}/${path}/${file.name}`;

            mv(oldPath, newPath, err => {
                if (err) {
                    res.write(err.toString());
                } else {
                    res.write('');
                    res.write(`
                        <html lang="eng">
                            <head>
                                <title>uploading...</title>  
                                <meta http-equiv="refresh" content="0;URL='https://entropyengine.dev/editor?p=${clean(projectID)}&from=${from}'"/>
                            </head>
                            <body>
                                <div style="display: flex; align-items: center; justify-content: center; height: 100%">
                                    <p style="text-align: center; font-size: xx-large">
                                        File uploaded! Returning to project...
                                    </p>
                                </div>
                            </body>
                            </html>
                    `);
                }

                res.end();
            });
        });
    });
};

exports.findScript = ({token, res}) => {

    function fromDir (startPath, filter) {

        let paths = [];

        if (!fs.existsSync(startPath)) return;

        let files = fs.readdirSync(startPath);
        for (let i = 0; i < files.length; i++){
            let filename = path.join(startPath, files[i]);
            let stat = fs.lstatSync(filename);
            if (stat.isDirectory()) {
                paths = [...paths, ...fromDir(filename, filter)]; // recurse
            }
            else if (filename.indexOf(filter) >= 0) {
                paths = [...paths, filename];
            }
        }
        return paths;
    }

    exports.accessLevel({token, res: {
        end: (value) => {
            value = JSON.parse(value);
            if (value.accessLevel < 1) {
                console.error(`Attempt to access files in project ${clean(token.project)} without authorisation. Token:`, token);
                res.end(JSON.stringify([]));
                return;
            }

            let paths = fromDir(`../projects/${clean(token.project)}/assets`,'.es');
            res.end(JSON.stringify(paths));
        }
    }});
};