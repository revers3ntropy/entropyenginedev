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


exports.username = ({res, token}) => {
    query(`SELECT username FROM users WHERE _id=${token.user} LIMIT 1`, value => {
        res.end(JSON.stringify(value[0]));
    });
};

exports.userExists = ({res, token}) => {
    query(`
    
    SELECT
        _id
    FROM 
         users
    WHERE 
          _id = ${token.user}
    
    `, data => {
        res.end(JSON.stringify({
            // if multiple accounts have the same id, then it won't let you in
            exists: data.length === 1
        }));
    });
}

exports.id = ({res, body}) => {
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

exports.usernameExists = ({res, body}) => {
    query(`SELECT * from users WHERE username='${body.username}'`, value => {
        res.end(JSON.stringify({
            exists: value.length > 0 ? "1" : "0"
        }));
    });
};

exports.details = ({res, token}) => {
    query(`SELECT username, name, email FROM users WHERE _id=${token.user}`, value => {
        res.end(JSON.stringify(value[0]));
    });
};


exports.newUser = ({res, body}) => {

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
                            '${body.username}',
                            '${body.name}',
                            '${body.email}',
                            0, 
                            MD5('${salt}:${pepper}:${body.password}'), 
                            '${salt}'
                        )`
                );
                res.end('{}');
            }
        };

        saltExists(salt, handlerSalt);
    });
};

exports.changeData = ({url, res, data}) => {
    query(`UPDATE users SET name='${data.name}', email='${data.email}' WHERE _id=${url[2]}`);
    res.end('{}');
};

exports.delete = ({res, token}) => {
    query(`DELETE FROM users WHERE _id=${token.user}`);
    query(`DELETE FROM projectAccess WHERE userID=${token.user}`);
    res.end('{}');
};
