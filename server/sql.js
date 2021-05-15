const mysql = require('./node_modules/mysql');
const dotenv = require('./node_modules/dotenv').config();

let con = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE
});

let hasConnectedSQL = false;

con.connect((err) => {
    if (err) throw err;

    console.log("Connected to SQL server");
    hasConnectedSQL = true;
});

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
        if (err) throw err;
        if (then) then(result);
    });

    return true;
};