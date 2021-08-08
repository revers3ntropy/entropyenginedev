const query = require('./sql').query;

const idMax = parseInt(process.env.SEC_IDMAX);

exports.report = ({body, token}) => {
	query(`

	INSERT INTO 
	    reports 
	VALUES (
	        null,
	        ${token.user},
	        "${body.type}", 
	        "${body.issueID}", 
	        "${body.problem}", 
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
            UNIX_TIMESTAMP(reports.date) as date,
		
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
                ${id},
                ${token.user},
                ${token.project},
                "${body.content}",
                ${body.public},
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
    AND comments.projectID = ${token.project}
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
    AND comments._id=${body.commentID}

    LIMIT 1

    `, data => {
		res.end(JSON.stringify(data[0]));
	});
};

exports.deleteComment = ({res, body}) => {
	query(`
       
    DELETE FROM 
        comments
    WHERE
        _id = ${body.commentID}
    
    `, () => {
		res.end("{}");
	});
};