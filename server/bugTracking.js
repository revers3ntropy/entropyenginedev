const query = require('./sql').query;

/*
	
 */

exports.reportBug = (url, req, res, body) => {
	query(`
	
	INSERT INTO
	    bugs
	VALUES (
		null,
		${body.userID},
		'${body.title}',
        '${body.description}',
        '${body.reproduce}',
        '${body.expected}',
        '${body.actual}',
        ${body.severity},
        '${body.type}',
        '${body.extra}',
		'reported',
		null,
		null
	);
	
	`, () => {
		res.end("{}");
	})
};

exports.getBug = (url, req, res, body) => {
	query(`
	
	SELECT
		users.username,
		bugs._id,
		bugs.title,
		bugs.description,
		bugs.reproduce,
		bugs.expected,
		bugs.actual,
		bugs.severity,
		bugs.type,
		bugs.extra,
		bugs.status,
        UNIX_TIMESTAMP(bugs.lastStatusChange) as lastStatusChange,
        UNIX_TIMESTAMP(bugs.date) as date
	FROM
	     bugs,
	     users
	WHERE 
	      bugs.userID=users._id AND
	      bugs._id=${body.id}
	LIMIT 1
	
	`, data => {
		res.end(JSON.stringify(data[0]));
	});
};

exports.getBugs = (url, req, res, body) => {
	query(`
	
	SELECT
		users.username,
		bugs._id,
		bugs.title,
		bugs.description,
		bugs.reproduce,
		bugs.expected,
		bugs.actual,
		bugs.severity,
		bugs.type,
		bugs.extra,
		bugs.status,
		bugs.lastChangeStatus,
		bugs.date
	
	FROM 
	     bugs, 
	     users
	
	WHERE 
	      bugs.userID=users._id
	      
	  -- so that open security risks are not public
		AND (bugs.severity < 3 OR bugs.status="fixed")
	
	ORDER BY
        IF(bugs.status!="fixed", 1, 0) DESC,
	    (CASE 
	        WHEN bugs.type="bug" THEN 2
	        WHEN bugs.type="enhancement" THEN 1
	        WHEN bugs.type="feature" THEN 0
		END) DESC,
		bugs.severity DESC,
		bugs.lastStatusChange,
		bugs.date
	
	`, data => {
		res.end(JSON.stringify(data));
	});
};