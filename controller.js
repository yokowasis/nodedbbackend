'use strict';

var response = require('./res');
var connection = require('./conn');

async function dbQuery(sql, params = []) {
    return new Promise((resolve, reject)=>{
        connection.query(sql,
        params, 
        function (error, rows, fields){
            if(error){
                return reject(error);
            } else{
                resolve(rows);
            }
        })    
    });
}

async function getNamaMapel(id) {
    var rows = await dbQuery("SELECT * FROM mapel WHERE id = ?",[ id ]);
    if (rows.length) {
        return rows[0].kode;
    } else {
        return "";
    }
}

async function hitungNilai(mapel, jawaban) {
    jawaban = jawaban.split(";");
    var rows = await dbQuery("SELECT * FROM datamapel WHERE kode = ? ORDER BY no", [mapel]);
    var skor = 0;
    rows.forEach((element,i) => {
        if (element.kunci == jawaban[i]) {
            if (element.skor) {
                skor += parseInt(element.skor);
            }
        }
    });
    return (skor);
}

exports.users = function(req, res) {
    connection.query('SELECT * FROM siswa', function (error, rows, fields){
        if(error){
            console.log(error)
        } else{
            response.ok(rows, res)
        }
    });
};

exports.ceknilai = function(req, res) {
    var username = req.params.username;
    var mapel = req.params.mapel;

    connection.query('SELECT * FROM hasil where username = ? AND mapel = ?',
    [ username, mapel  ], 
    function (error, rows, fields){
        if(error){
            response.ok(error, res)
        } else{
            response.ok(rows, res)
        }
    });


};

exports.findUsers = function(req, res) {
    
    var username = req.params.username;
    var password = req.params.password;
    var mapel = req.params.mapel;

    connection.query('SELECT * FROM siswa where username = ? AND password = ? AND mapel = ?',
    [ username, password, mapel  ], 
    function (error, rows, fields){
        if(error){
            console.log(error)
        } else{
            response.ok(rows, res)
        }
    });
};

exports.kumpul = function(req, res) {
    
    var username = req.params.username;
    var mapel = req.params.mapel;
    var jawaban = req.body.jawaban;

    // Ambil Data Test
    connection.query("SELECT no,kunci,skor FROM datamapel WHERE kode = ? ORDER BY no", 
    [ mapel ], 
    function(error, rows, fields){
        if(error){
            console.log(error)
        } else{

            var s = "";

            // Periksa Skor
            var skor = 0;
          	var i = 0;
          
          	for (let item in jawaban) {
                s += jawaban[item] + ";";
                try {
                    if (jawaban[item] == rows[i].kunci) {
                        skor += (rows[i].skor * 1);
                    }            
                }
                catch(err) {
                    console.log(err);
                }              
              	i++;
            }

            // Save Skor
            connection.query("INSERT INTO `hasil` (`username`, `mapel`, `nilai`, `jawaban`) VALUES (?, ?, ?, ?)",
            [ username, mapel, skor, s ],
            function(error, rows, fields){
                if (error) {
                    console.log (error)
                } else {
                    response.ok(skor,res);
                }
            })
        }
    });
};

exports.savemapel = async function(req, res) {
    var kode = req.body.kode;
    var rows = await dbQuery('DELETE FROM mapel WHERE kode = ?', [kode]);
    var rows = await dbQuery('INSERT INTO `mapel` (`kode`) VALUES ( ? )', [kode]);    
    var insertID = rows.insertId;
    res.send(insertID.toString());
}

exports.savekunci = async function(req, res) {
    if (typeof req.body.first !== 'undefined') {
        var first = req.body.first;
        var kode = req.body.kode;
    } else {
        var first = 0;
    }
    if (first) {
        var namaMapel = await getNamaMapel(kode);
        var rows = await dbQuery("DELETE FROM datamapel WHERE kode = ?" , [ namaMapel ] );
        response.ok(rows, res);
    } else {
        var kodemapel = await getNamaMapel(req.body.kode[0]);
        var no = req.body.no;
        no.forEach(async (element, index) => {
            var sql = `INSERT INTO datamapel 
                (kode,no,kunci,skor,grouping,lockn) VALUES 
                (?,?,?,?,?,?)
            `;
            var rows = await dbQuery(sql,
                [
                    kodemapel,
                    req.body.no[index],
                    req.body.kunci[index],
                    req.body.bobot[index],req.body.grouping[index],
                    req.body.locking[index]
                ]
            );
        })        
        response.ok("OK", res);
    }
}

exports.mapels = async function(req, res) {
    var rows = await dbQuery("SELECT * FROM `mapel`"); 
    response.ok(rows, res);
};

exports.index = function(req, res) {
    response.ok("Hello from the Node JS RESTful side!", res)
};

exports.uploadsiswa = async function(req, res) {
    var namaMapel = req.body["mapel-1"];
    if (typeof req.body.first !== 'undefined') {
        var rows = await dbQuery("DELETE FROM siswa WHERE mapel = ?", [namaMapel]);        
    }
    var length = req.body.count;    
    for (let index = 1; index <= length; index++) {
        var rows = await dbQuery(`
            INSERT INTO siswa (username, password, nama, sekolah, mapel)
            VALUES
            (?,?,?,?,?)
        `,[
            req.body["user-" + index],
            req.body["pass-" + index],
            req.body["nama-" + index],
            req.body["nik2-" + index],
            req.body["mapel-" + index],
        ]);        
    }
    res.send("OK");
};

exports.rekap = async function (req, res) {
    var mapel = req.query.aktif;
    var rows = await dbQuery("SELECT * FROM `hasil` WHERE mapel = ? ", [ mapel ]);
    var i = 0;
    var s = "";

    for (const element of rows) {
        i++;
        var nilai = await hitungNilai(element.mapel,element.jawaban);
        s += i + ";";
        s += "-;";
        s += "-;";
        s += element.username + ";";
        s += element.mapel + ";";
        s += "" + ";";
        s += nilai + ";";
        s += "" + ";";
        s += element.jawaban + "|";
        console.log("Process");        
    }
    res.send(s);
}