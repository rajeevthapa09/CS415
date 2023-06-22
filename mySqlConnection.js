var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "library"
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected to the database!");
});

var sql = {};

sql.selectQuery = function (query, arr, callback) {
  con.query(query, arr, callback);
}

module.exports = sql;