var mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

var pool = mysql.createPool({
  connectionLimit : 100000,
  queueLimit : 0,
  host: process.env.DBHOST,
  port: process.env.DBPORT,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  multipleStatements : true,
  database: process.env.DBNAME
});

module.exports = pool;
