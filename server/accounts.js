const query = require('./sql').query;
const dotenv = require('./node_modules/dotenv').config();

const saltCharacters = process.env.SEC_SALTCHARS;
const pepper = process.env.SEC_PEPPER;
const idMax = parseInt(process.env.SEC_IDMAX);
const saltLength = parseInt(process.env.SEC_SALTLENGTH);

const saltExists = (salt, callback) => {
    query(`SELECT salt FROM users WHERE salt='${salt}'`, result => {
        callback(result.length > 0);
    });
};

const genSalt = () => {
    let result = ['s', '-'];
    for (let i = 0; i < saltLength; i++) {
        result.push(saltCharacters.charAt(Math.floor(Math.random() * saltCharacters.length)));
    }
    return result.join('');
};


exports.username = (url, req, res, body) => {
    query(`SELECT username FROM users WHERE _id=${body.userID}`, value => {
        res.end(JSON.stringify(value[0]));
    });
};

exports.id = (url, req, res, body) => {
    query(`
SELECT _id 
from users 
WHERE
      username='${body.username}'
  AND password=MD5(CONCAT(salt, ':${pepper}', ':${body.password}'
))`, value => {
        if (value.length !== 1) {
            res.end(`{"_id": 0}`);
            return;
        }
        if (!value[0]._id) {
            res.end(`{"_id": 0}`);
            return;
        }

        res.end(JSON.stringify(value[0]));
    });
};

exports.usernameExists = (url, req, res, body) => {
    query(`SELECT * from users WHERE username='${body.username}'`, value => {
        res.end(JSON.stringify({
            exists: value.length > 0 ? "1" : "0"
        }));
    });
};

exports.details = (url, req, res, body) => {
    query(`SELECT username, name, email FROM users WHERE _id=${body.userID}`, value => {
        res.end(JSON.stringify(value[0]));
    });
};


exports.newUser = (url, req, res, data) => {

    query(`SELECT FLOOR (1 + RAND() * ${idMax}) AS value FROM users HAVING value NOT IN (SELECT DISTINCT _id FROM users) LIMIT 1`, value => {
        const id = value[0]?.value || Math.ceil(Math.random() * idMax);

        let salt = genSalt();

        const handlerSalt = exists => {
            if (exists) {
                salt = genSalt();
                saltExists(salt, handlerSalt);
            }
            else {
                // finally got both, can add user to table now
                query(`
                        INSERT INTO users
                        VALUES (
                            ${id},
                            '${data.username}',
                            '${data.name}',
                            '${data.email}',
                            0, 
                            MD5('${salt}:${pepper}:${data.password}'), 
                            '${salt}'
                        )`
                );
                res.end('{}');
            }
        };

        saltExists(salt, handlerSalt);
    });
};

exports.changeData = (url, req, res, data) => {
    query(`UPDATE users SET name='${data.name}', email='${data.email}' WHERE _id=${url[2]}`);
    res.end('{}');
};

exports.delete = (url, req, res, body) => {
    query(`DELETE FROM users WHERE _id=${body.userID}`);
    query(`DELETE FROM projectAccess WHERE userID=${body.userID}`);
    res.end('{}');
};