'use strict';

var response = require('./res');
var pool = require('./conn');

async function dbQuery(sql, params = []) {
    return new Promise((resolve, reject)=>{
        pool.query(sql,
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
                skor += element.skor * 1;
            }
        }
    });
    return (Math.round(skor * 100) / 100);
}

exports.users = function(req, res) {
    pool.query('SELECT * FROM siswa', function (error, rows, fields){
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

    pool.query('SELECT * FROM hasil where username = ? AND mapel = ?',
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

    pool.query('SELECT * FROM siswa where username = ? AND password = ? AND mapel = ?',
    [ username, password, mapel  ], 
    function (error, rows, fields){
        if(error){
            console.log(error)
        } else{
            response.ok(rows, res)
        }
    });
};

exports.kumpul = async function(req, res) {
    
    var username = req.params.username;
    var mapel = req.params.mapel;
    var jawaban = req.body.jawaban;

    var hasil = await dbQuery("SELECT * FROM hasil WHERE username = ? AND mapel = ?",[
        username, mapel
    ]);

    if (hasil.length) {
        response.ok(hasil[0].nilai,res);
        return;
    }

    var datamapel = await dbQuery("SELECT no,kunci,skor FROM datamapel WHERE kode = ? ORDER BY no", 
    [ mapel ]);

    var s = "";

    // Periksa Skor
    var skor = 0;
    var i = 0;

    for (let item in jawaban) {
        s += jawaban[item] + ";";
        try {
            if (jawaban[item] == datamapel[i].kunci) {
                skor += (datamapel[i].skor * 1);
            }            
        }
        catch(err) {
            console.log(err);
        }              
        i++;
    }

    skor = Math.round(skor * 100) / 100;

    // Save Skor
    dbQuery("INSERT INTO `hasil` (`username`, `mapel`, `nilai`, `jawaban`) VALUES (?, ?, ?, ?)",
    [ username, mapel, skor, s ])
    .then( () =>{
        response.ok(skor,res);
    })
    .catch( err =>{
        console.log (err);
        response.ok(err,res);
    })
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
    var rows = await dbQuery("SELECT * FROM `hasil` WHERE mapel = ? GROUP BY username,mapel ORDER BY id", [ mapel ]);
    var i = 0;
    var s = "";

    for (const hasil of rows) {
        i++;
        var nilai = await hitungNilai(hasil.mapel,hasil.jawaban);
        var siswa = await dbQuery("SELECT * FROM siswa WHERE username = ? AND mapel = ? LIMIT 1",[
            hasil.username, hasil.mapel
        ])
        s += i + ";";
        s += `${siswa[0].sekolah};`;
        s += `${siswa[0].nama};`;
        s += hasil.username + ";";
        s += hasil.mapel + ";";
        s += "" + ";";
        s += nilai + ";";
        s += "" + ";";
        s += hasil.jawaban + "|";
        // console.log("Process");        
    }
    res.send(s);
}