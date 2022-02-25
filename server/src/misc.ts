import {clean} from "./util";
import { Handler } from "./index";
import {query} from './sql';
import fs from 'fs';
import {authLevel} from "./projects";

if (!process.env.SEC_IDMAX) {
	throw 'process.env.SEC_IDMAX not defined';
}
const idMax = parseInt(process.env.SEC_IDMAX);

export const comment: Handler = async ({res, body, token}) => {
	const value = await query(`

        SELECT 
               FLOOR (1 + RAND() * ${idMax}) AS value 
        FROM comments 
        HAVING value 
                   NOT IN (SELECT DISTINCT _id FROM comments) 
        LIMIT 1

    `);

	const id = value[0]?.value || Math.ceil(Math.random() * idMax);

	await query(`

		INSERT INTO
			comments
		VALUES(
			${clean(id)},
			${clean(token?.user.toString())},
			${clean(token?.project.toString())},
			"${clean(body.content)}",
			${clean(body.public)},
			CURRENT_TIMESTAMP
		)
		
	`);
	res.end(JSON.stringify({id}));
};

export const getComments: Handler = async ({res, body, token}) => {
	const data = await query(`

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
		AND comments.projectID = ${clean(token?.project.toString())}
		AND public = ${body.public ? 1 : 0}
	
		ORDER BY 
			comments.date DESC

    `);
	
	res.end(JSON.stringify(data));
};

export const getComment: Handler = async ({res, body}) => {
	const data = await query(`

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

    `);

	res.end(JSON.stringify(data[0]));
};

export const deleteComment: Handler = async ({res, body, token}) => {
	const {level} = await query(`
		SELECT level from users WHERE _id = ${clean(token?.user.toString())}
	`);
	const {userID} = await query(`
		SELECT userID from comments WHERE _id = ${clean(body.commentID)}
	`);
	// check to see if the user did not write the comment they have to have a high
	// level to be able to delete it.
	if (level < 2 && userID !== token?.user) {
		return;
	}
	await query(`

		DELETE
		FROM comments
		WHERE _id = ${clean(body.commentID)}
	
	`);

	res.end("{}");
};

export const receiveEEClientScripts: Handler = async ({res, body, token}) => {
	if (!token) {
		res.end(JSON.stringify({done: false}));
		return;
	}

	const [accessLevel, _] = await authLevel(token.user, token.project);

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

};