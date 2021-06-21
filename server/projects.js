const query = require('./sql').query,
    fs = require('fs'),
    fse = require('./node_modules/fs-extra'),
    dotenv = require('./node_modules/dotenv').config(),
    mv = require('./node_modules/mv'),
    util = require('./util.js'),
    formidable = require('./node_modules/formidable');

const idMax = parseInt(process.env.SEC_IDMAX);

const emptyScripts = ``;

exports.shareProject = (url, req, res, body) => {
    query(`

    INSERT INTO projectAccess VALUES (${body.userID}, ${body.projectID}, ${body.level});
    INSERT INTO projectSaves VALUES (${body.userID}, ${body.projectID}, null);
    
    `);
};

exports.createProject = (url, req, res, body) => {

    query(`

        SELECT 
               FLOOR (1 + RAND() * ${idMax}) AS value 
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

        // got the id, now do the same thing for the salt
        query(`

            INSERT INTO projects VALUES (${id}, '${body.name}', 0, 0);
            INSERT INTO projectSaves VALUES (${body.userID}, ${id}, CURRENT_TIMESTAMP);
           
       `);

        res.end(JSON.stringify({
            projectID: id
        }));

        const dir = `../projects/${id}`;

        fs.mkdirSync(dir);
        fs.mkdirSync(dir + '/assets');

        fs.copyFile('../templates/project.txt', dir + '/index.json', err => {
            if (err) {
                console.error(`Creating JSON file in ${dir} failed: ${err}`);
                return;
            }
            console.log('made JSON file in ' + dir);
        });

        fs.appendFile(dir + '/scripts.js', emptyScripts, err => {
            console.log('made scripts.js file in ' + dir);
        });

        fs.copyFile('../templates/globalState.txt', dir + '/globalState.json', err => {
            if (err) {
                console.error(`Creating globalState.json file in ${dir} failed: ${err}`);
                return;
            }
            console.log('made  globalState.json file in ' + dir);
        });

        exports.shareProject(url, req, res, {
            userID: body.userID,
            projectID: id,
            level: 2
        });
    });
};

exports.deleteProject = (url, req, res, body) => {
    /**
     * Checks if the user is allowed to perform that action,
     * and if they are then deletes all data associated with the project
     *
     * Requires the userAccess.level to be at 2 or more
     */
    query(`SELECT level FROM projectAccess WHERE userID=${body.userID}`, value => {
        const userLevel = value[0].level;
        if (userLevel < 2) {
            res.end(JSON.stringify({
                ok: false
            }));
            return;
        }

        // delete files
        const dir = `../projects/${body.projectID}`;
        fs.rmdirSync(dir, { recursive: true });

        //  actual deletion:
        // delete rows in SQL database
        query(`

        DELETE FROM projects WHERE _id=${body.projectID};
        DELETE FROM projectAccess WHERE projectID=${body.projectID};
        DELETE FROM comments WHERE projectID=${body.projectID};
        DELETE FROM projectSaves WHERE projectID=${body.projectID};
        DELETE FROM projectViews WHERE projectID=${body.projectID};
        DELETE FROM reports WHERE issueID=${body.projectID} AND type="project";

        `, () => {
            res.end(JSON.stringify({
                ok: true
            }));
        });
    });

};

exports.publicProjectsFromUser = (url, req, res, body) => {
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
                projectAccess.userID = ${body.userID}
            AND
                (projectAccess.level > 0 OR projects.globalAccess > 0)
            AND 
                users.username = '${body.username}'
        
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

exports.getUserProjectNames = (url, req, res, body) => {
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
            projectAccess.userID = ${body.userID}
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

exports.getProjectEditors = (url, req, res, body) => {
    query(`
        SELECT users.username
        FROM projectAccess, users
        WHERE 
            projectAccess.userID=users._id AND
            projectAccess.projectID=${body.projectID}
    `, values => {
        res.end(JSON.stringify(values));
    });
};

exports.save = (url, req, res, body) => {
    const dir = `../projects/${body.projectID}`;

    fs.writeFileSync(dir + '/index.json', body.json);

    fs.writeFileSync(dir + '/scripts.js', body.scripts);

    query(`INSERT INTO projectSaves VALUES(${body.userID}, ${body.projectID}, CURRENT_TIMESTAMP)`, () => {
        res.end(`{"result": "true"}`);
    });
};

exports.accessLevel = (url, req, res, body) => {
    query(`SELECT globalAccess from projects WHERE _id=${body.projectID}`, globalAccess => {
        query(`SELECT level FROM projectAccess WHERE projectID=${body.projectID} AND userID=${body.userID}`, personalAccess => {
            const personal = personalAccess[0]?.level || 0;
            const global = globalAccess[0]?.globalAccess || 0;

            res.end(JSON.stringify({
                type: (personal) >= global ? 'personal' : 'global',
                accessLevel: Math.max(personal, global)
            }));
        });
    });
};

exports.getName = (url, req, res, body) => {
    query(`SELECT name FROM projects WHERE _id=${body.projectID}`, value => {
        res.end(JSON.stringify({
            name: value[0].name
        }));
    });
};

exports.share = (url, req, res, body) => {

    if (!body.username) {
        // share project globally
        query(`UPDATE projects SET globalAccess=${body.accessLevel} WHERE _id=${body.projectID}`);
        res.end("{}");
        return;
    }
    query(`SELECT _id FROM users WHERE username='${body.username}'`, user => {
        const userID = user[0]._id;

        query(`SELECT *
               FROM projectAccess,users
               WHERE users._id = projectAccess.userID
                 AND projectAccess.userID = ${userID}
                 AND projectAccess.projectID = ${body.projectID}`, values => {
            if (values.length > 0) {
                query(`
                    UPDATE projectAccess
                    SET projectAccess.level=${body.accessLevel}
                    WHERE projectAccess.projectID = ${body.projectID}
                      AND projectAccess.userID = ${userID}
                `);
            } else {
                query(`
                    INSERT INTO projectAccess
                    VALUES (${userID}, ${body.projectID}, ${body.accessLevel})
                `);
            }
        });
    });

    res.end("{}");
};

const buildHTML = (htmlTitle, projectID) => {
    let raw = fs.readFileSync('../templates/buildHTML.txt');
    raw = raw.toString();
    raw = raw.replace(/ID/, projectID);
    raw = raw.replace(/TITLE/, htmlTitle);
    return raw;
};

exports.build = (url, req, res, body) => {
    const projectDir = `../projects/${body.projectID}`;
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
        buildHTML('Entropy Engine', body.projectID)
    );

    query(`
    
    UPDATE projects
    SET projects.hasBuild = 1
    WHERE projects._id = ${projectID}
    
    `, () => {
        res.end("{}");
    });
};


exports.getAssets = (url, req, res, body) => {
    const dir = `../projects/${body.projectID}/assets`;
    const files = [];

    for (const fileName of fs.readdirSync(dir)) {
        files.push({
            fileName,
        });
    }

    res.end(JSON.stringify(files));
};

exports.deleteAsset = (url, req, res, body) => {
    const path = `../projects/${body.projectID}/assets/${body.fileName}`;
    fs.unlinkSync(path);
    res.end("{}");
};

exports.beenBuilt = (url, req, res, body) => {
    let built = false;

    if (fs.existsSync(`../projects/${body.projectID}/build/assets`)) {
        built = true;
    }

    res.end(JSON.stringify({built}));
};

exports.contributorInfo = (url, req, res, body) => {
    // get a table with columns:
    //  username - username
    //  count - number of saves
    //  latest - most recent save
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
               AND projectSaves.projectID = ${body.projectID}
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
};

exports.latestContributor = (url, req, res, body) => {
    query(`
        SELECT 
            users.username,
            UNIX_TIMESTAMP(projectSaves.date) as date
        FROM 
            users,
            projectSaves
        WHERE
              users._id = projectSaves.userID
          AND projectSaves.projectID = ${body.projectID}
        ORDER BY 
                 projectSaves.date 
                 DESC 
        LIMIT 1
    `, value => {
        res.end(JSON.stringify(value));
    });
};

exports.allContributors = (url, req, res, body) => {
    query(`
    
    SELECT 
           users.username,
           UNIX_TIMESTAMP(projectSaves.date) as date
    FROM 
         users, 
         projectSaves 
    WHERE 
        users._id=projectSaves.userID
    AND projectID=${body.projectID || url[1]}
    
    `, data => {
        res.end(JSON.stringify(data));
    });
};

exports.projectOwner = (url, req, res, body) => {
    query(`
    
    SELECT
        users.username
    FROM
        users, projectAccess, projects
    WHERE 
          users._id=projectAccess.userID
        AND projectAccess.projectID=projects._id
        AND projects._id=${body.projectID}
        AND projectAccess.level>=2
    
    LIMIT 1
    
    `, data => {

        query(`
        
        SELECT COUNT(distinct userID) as count
        FROM projectSaves
        WHERE projectID=${body.projectID}
        
        `, total => {

            res.end(JSON.stringify({
                owner: data[0]?.username,
                totalContributors: total[0].count
            }));
        });
    });
};

exports.viewed = (url, req, res, body) => {
    query(`
    INSERT INTO projectViews
    VALUES (${body.userID}, ${body.projectID}, CURRENT_TIMESTAMP)
    `, () => {
        res.end("{}");
    });
};

exports.projectViews = (url, req, res, body) => {
    query(`
    SELECT COUNT(distinct userID) as count
    FROM projectViews
    WHERE projectID=${body.projectID}
    `, unique => {

        query(`
        SELECT COUNT(*) as count
        FROM projectViews
        WHERE projectID=${body.projectID}
        `, total => {

            res.end(JSON.stringify({
                unique: unique[0].count,
                total: total[0].count
            }));

        });
    });
};

exports.topProjectViews = (url, req, res, body) => {
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


exports.updateGlobalState = (url, req, res, body) => {
    let path;

    if (body.token.isBuild) {
        path = `../projects/${body.token.projectID}/build/globalState.json`;
    } else {
        path = `../projects/${body.token.projectID}/globalState.json`;
    }

    const file = fs.readFileSync(path);
    const data = JSON.parse(file);

    data[body.name] = body.replace;

    fs.writeFileSync(path, data);

    res.end("{}");
};

exports.upload = async (url, req, res) => {

    url.shift();

    const projectID = url.shift();
    const from = url.shift();
    const path = url.join('/') || '';


    const assetsPath = `../projects/${projectID}/assets`;
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

                    <p style="text-align: center; font-size: xx-large">
                        File uploaded! Returning to project...
                    </p>
                    
                    
                    <script>
                        window.location.href = 'https://entropyengine.dev/editor?p=${projectID}&from=${from}'
                    </script>
                    `);
                }

                res.end();
            });
        });
    });


}