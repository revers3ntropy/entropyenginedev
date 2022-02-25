const {clean} = require("./util");
const query = require('./sql').query;
const dotenv = require('dotenv').config();

const saltCharacters = process.env.SEC_SALTCHARS,
      pepper = process.env.SEC_PEPPER,
      idMax = parseInt(process.env.SEC_IDMAX),
      saltLength = parseInt(process.env.SEC_SALTLENGTH);

const saltExists = (salt, callback) => {
    query(`SELECT salt FROM users WHERE salt='${clean(salt)}'`, result => {
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
    query(`SELECT username FROM users WHERE _id=${clean(token.user)} LIMIT 1`, value => {
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
          _id = ${clean(token.user)}
    
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
      username='${clean(body.username)}'
  AND password=MD5(CONCAT(salt, ':${clean(pepper)}', ':${clean(body.password)}'
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
    query(`SELECT * from users WHERE username='${clean(body.username)}'`, value => {
        res.end(JSON.stringify({
            exists: value.length > 0 ? "1" : "0"
        }));
    });
};

exports.details = ({res, token}) => {
    query(`SELECT username, name, email FROM users WHERE _id=${clean(token.user)}`, value => {
        res.end(JSON.stringify(value[0]));
    });
};


exports.newUser = ({res, body}) => {

    query(`SELECT FLOOR (1 + RAND() * ${clean(idMax)}) AS value FROM users HAVING value NOT IN (SELECT DISTINCT _id FROM users) LIMIT 1`, value => {
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
                            ${clean(id)},
                            '${clean(body.username)}',
                            '${clean(body.name)}',
                            '${clean(body.email)}',
                            0, 
                            MD5('${clean(salt)}:${clean(pepper)}:${clean(body.password)}'), 
                            '${clean(salt)}'
                        )`
                );
                res.end('{}');
            }
        };

        saltExists(salt, handlerSalt);
    });
};

exports.changeData = ({url, res, body}) => {
    query(`UPDATE users SET name='${clean(body.name)}', email='${clean(body.email)}' WHERE _id=${clean(url[2])}`);
    res.end('{}');
};

exports.delete = ({res, token}) => {
    query(`DELETE FROM users WHERE _id=${clean(token.user)}`);
    query(`DELETE FROM projectAccess WHERE userID=${clean(token.user)}`);
    res.end('{}');
};
