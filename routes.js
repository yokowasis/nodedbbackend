'use strict';

module.exports = function(app) {
    var todoList = require('./controller');

    app.route('/')
        .get(todoList.index);

    app.route('/users')
        .get(todoList.users);

    app.route('/mapels')
        .get(todoList.mapels);

    app.route('/login/:mapel/:username/:password')
        .get(todoList.findUsers);

    app.route('/ceknilai/:mapel/:username')
        .get(todoList.ceknilai);

    app.route('/kumpul/:mapel/:username')
        .post(todoList.kumpul);   
        
    app.route('/wp-content/themes/unbk/api-18575621/options.php')
        .post(todoList.savemapel);   
        
    app.route('/wp-content/themes/unbk/api-18575621/kunci.php')
        .post(todoList.savekunci);   
        
    app.route('/wp-content/themes/unbk/api-18575621/uploadsiswa.php')
        .post(todoList.uploadsiswa);   
        
};

