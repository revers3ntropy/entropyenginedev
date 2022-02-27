import mysql from 'mysql';
import {config} from 'dotenv';
config();

const dbConfig = {
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
    // security risk, but useful
    multipleStatements: true
};

let con:  mysql.Connection;

let hasConnectedSQL = false;

/**
 *   Queries the mySQL database 'entropye_ngine_users'
 *
 *   @param {string} sql The SQL query
 *   @returns {boolean} Has connected yet
 */
export const query = (sql: string): Promise<any> => {
    return new Promise((resolve, fail) => {
        if (!hasConnectedSQL) {
            fail(new Error('not connected to mysql db yet'));
        }

        con.query(sql, (err, result) => {
            if (err) {
                console.error(err);
                fail(err);
            }
            resolve(result);
        });
    })
};

/**
 * brings the SQL connection back online when it periodically disconnections.
 * Note: recursively called on error
 */
function handleDisconnect() {
    con = mysql.createConnection(dbConfig);

    con.connect((err) => {
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 500);
        }

        console.log("Connected to SQL server");
        hasConnectedSQL = true;
    });

    con.on('error', (err) => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();