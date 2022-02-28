import {clean} from "./util";
import { Handler } from "./index";
import {query} from './sql';

if (!process.env.SEC_IDMAX) {
    throw 'process.env.SEC_IDMAX not defined';
}
if (!process.env.SEC_SALTLENGTH) {
    throw 'process.env.SEC_SALTLENGTH not defined';
}
if (!process.env.SEC_SALTCHARS) {
    throw 'process.env.SEC_SALTCHARS not defined';
}
if (!process.env.SEC_PEPPER) {
    throw 'process.env.SEC_PEPPER not defined';
}

const saltCharacters = process.env.SEC_SALTCHARS,
      pepper = process.env.SEC_PEPPER,
      idMax = parseInt(process.env.SEC_IDMAX),
      saltLength = parseInt(process.env.SEC_SALTLENGTH);

const saltExists = async (salt: string) => {
    return (await query(`SELECT salt FROM users WHERE salt='${clean(salt)}'`)) > 0;
};

const genSalt = () => {
    let result = ['s', '-'];
    for (let i = 0; i < saltLength; i++) {
        result.push(saltCharacters.charAt(Math.floor(Math.random() * saltCharacters.length)));
    }
    return result.join('');
};


export const username: Handler = async ({res, token}) => {
    const value = await query(`SELECT username FROM users WHERE _id=${clean(token?.user)} LIMIT 1`);
    res.end(JSON.stringify(value[0]));
};

export const userExists: Handler = async ({res, token}) => {
    const data = await query(`
    
        SELECT
            _id
        FROM 
             users
        WHERE 
              _id = ${clean(token?.user)}
    
    `);

    res.end(JSON.stringify({
        // if multiple accounts have the same id, then it won't let you in
        exists: data.length === 1
    }));
}

export const id: Handler = async ({res, body}) => {
    const value = await query(`
        SELECT _id 
        from users 
        WHERE
              username='${clean(body.username)}'
          AND password=MD5(CONCAT(salt, ':${clean(pepper)}', ':${clean(body.password)}'))
    `);

    if (value.length !== 1) {
        res.end(`{"_id": 0}`);
        return;
    }
    if (!value[0]._id) {
        res.end(`{"_id": 0}`);
        return;
    }

    res.end(JSON.stringify(value[0]));
};

export const usernameExists: Handler = async ({res, body}) => {
    const value = await query(`SELECT * from users WHERE username='${clean(body.username)}'`);
    res.end(JSON.stringify({
        exists: value.length > 0 ? "1" : "0"
    }));
};

export const details: Handler = async ({res, token}) => {
    const value = await query(`SELECT username, name, email FROM users WHERE _id=${clean(token?.user)}`);
    res.end(JSON.stringify(value[0]));
};


export const newUser: Handler = async ({res, body}) => {

    const value = await query(`SELECT FLOOR (1 + RAND() * ${clean(idMax)}) AS value FROM users HAVING value NOT IN (SELECT DISTINCT _id FROM users) LIMIT 1`);
    const id = value[0]?.value || Math.ceil(Math.random() * idMax);

    let salt = genSalt();

    while (!(await saltExists(salt))) {
        salt = genSalt();
    }

    await query(`
        INSERT INTO users
        VALUES (
            ${clean(id)},
            '${clean(body.username)}',
            '${clean(body.name)}',
            '${clean(body.email)}',
            0, 
            MD5('${clean(salt)}:${clean(pepper)}:${clean(body.password)}'), 
            '${clean(salt)}'
        )
    `);
    res.end('{}');
};

export const changeData: Handler = async ({url, res, body}) => {
    await query(`UPDATE users SET name='${clean(body.name)}', email='${clean(body.email)}' WHERE _id=${clean(url[2])}`);
    res.end('{}');
};

export const deleteAccount: Handler = async ({res, token}) => {
    await query(`DELETE FROM users WHERE _id=${clean(token?.user)}`);
    await query(`DELETE FROM projectAccess WHERE userID=${clean(token?.user)}`);
    res.end('{}');
};
