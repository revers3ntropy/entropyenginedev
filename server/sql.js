const mysql = require('./node_modules/mysql');
const dotenv = require('./node_modules/dotenv').config();

const dbConfig = {
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
    // security risk, but useful
    multipleStatements: true
};

let con;

let hasConnectedSQL = false;

exports.query = (sql, then) => {
    /**
     *   Queries the mySQL database 'entropye_ngine_users'
     *
     *   @param {string} sql The SQL query
     *   @param {function} then Called when the query has been completed, passes the result of the query
     *   @returns {boolean} Has connected yet
     */
    if (!hasConnectedSQL) return false;

    con.query(sql, (err, result) => {
        if (err)
            console.error(err);

        if (then)
            then(result);
    });

    return true;
};

// brings the SQL connection back online when it periodically disconnections
function handleDisconnect() {
    con = mysql.createConnection(dbConfig); // Recreate the connection, since
                                            // the old one cannot be reused.

    con.connect(err => {                     // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 1000); // We introduce a delay before attempting to reconnect,
        }

        console.log("Connected to SQL server");
        hasConnectedSQL = true;// to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    con.on('error', err => {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();