const {clean} = require("./util");
const {query} = require('./sql');
const fs = require('fs');
const {authLevel} = require("./projects");

const idMax = parseInt(process.env.SEC_IDMAX);

exports.report = ({body, token}) => {
	query(`

	INSERT INTO 
	    reports 
	VALUES (
	        null,
	        ${clean(token.user)},
	        "${clean(body.type)}", 
	        "${clean(body.issueID)}", 
	        "${clean(body.problem)}", 
	        CURRENT_TIMESTAMP
		);
	`);
};

exports.getReport = ({res, body}) => {
	query(`
		SELECT 
			users.username,
			reports.type,
			reports.problem,
            UNIX_TIMESTAMP(reports.date) as date
		
		FROM 
		     users,
		     reports
		
		WHERE
			reports._id=${body.reportID} AND
		    reports.userID=users._id
		LIMIT 1
		
	`, data => {
		res.end(JSON.stringify(data[0]));
	});
};

exports.comment = ({res, body, token}) => {
	query(`

        SELECT 
               FLOOR (1 + RAND() * ${idMax}) AS value 
        FROM comments 
        HAVING value 
                   NOT IN (SELECT DISTINCT _id FROM comments) 
        LIMIT 1

    `, value => {
		const id = value[0]?.value || Math.ceil(Math.random() * idMax);

		query(`

            INSERT INTO
                comments
            VALUES(
                ${clean(id)},
                ${clean(token.user)},
                ${clean(token.project)},
                "${clean(body.content)}",
                ${clean(body.public)},
                CURRENT_TIMESTAMP
            )
            
        `, () => {
			res.end(JSON.stringify({id}));
		})
	});
};

exports.getComments = ({res, body, token}) => {
	query(`

    SELECT
        users.username,
        comments.content,
        UNIX_TIMESTAMP(comments.date) as date,
        comments._id
    FROM 
        comments, 
        users
    WHERE
        users._id = comments.userID
    AND comments.projectID = ${clean(token.project)}
    AND public = ${body.public ? 1 : 0}

    ORDER BY 
        comments.date DESC

    `, data => {
		res.end(JSON.stringify(data));
	});
};

exports.getComment = ({res, body}) => {
	query(`

    SELECT
        users.username,
        comments.content,
        UNIX_TIMESTAMP(comments.date) as date,
        comments._id
    FROM 
        comments, 
        users
    WHERE
        users._id = comments.userID
    AND comments._id=${clean(body.commentID)}

    LIMIT 1

    `, data => {
		res.end(JSON.stringify(data[0]));
	});
};

exports.deleteComment = ({res, body, token}) => {
	query(`
		SELECT level from users WHERE _id = ${clean(token.user)}
	`, ({level}) => {
		query(`
			SELECT userID from comments WHERE _id = ${clean(body.commentID)}
		`, ({userID}) => {
			// check to see if the user did not write the comment they have to have a high
			// level to be able to delete it.
			if (level < 2 && userID !== token.user) return;
			query(`

                DELETE
                FROM comments
                WHERE _id = ${clean(body.commentID)}

			`, () => {
				res.end("{}");
			});
		});
	});
};

exports.receiveEEClientScripts = ({res, body, token}) => {
	authLevel(token.user, token.project, (accessLevel) => {
		if (accessLevel < 1) {
			res.end(JSON.stringify({done: false}));
			return;
		}

		for (const path in body.files) {
			let fullPath = `../projects/${token.project}/assets/${path}`
			if (!fs.existsSync(fullPath)) {
				try {
					fs.appendFileSync(fullPath, '');
				} catch (e) {
					console.error(`Error receiving files: ${e}`);
					res.end(JSON.stringify({done: false}));
					return;
				}
			}
			fs.writeFileSync(fullPath, body.files[path]);
		}

		res.end(JSON.stringify({done: true}));
	});

};