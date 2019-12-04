var mysql = require('mysql');

// var con = mysql.createConnection({
//   host: "192.168.6.2",
//   user: "root",
//   password: "IPBnds83715",
//   multipleStatements : true,
//   database: "nodedb"
// });

var con = mysql.createConnection({
  host: "localhost",
  port: "3212",
  user: "root",
  password: "",
  multipleStatements : true,
  database: "nodedb"
});

con.connect(function (err){
    if(err) throw err;
});

module.exports = con;

