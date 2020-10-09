var mysql = require('mysql');


const db = {

    "desarrollo": {
        host: '190.217.113.102',
        user: 'dvn',
        password: 'Duvan07*',
        database: 'sgd'
    },

    "produccion": {
        host: '10.10.13.2',
        user: 'jburgos',
        password: '18131047Mn*',
        database: 'sigedin_desarrollo'
    }

};

const auth = {

    "desarrollo": {
        host: '190.217.113.102',
        user: 'dvn',
        password: 'Duvan07*',
        database: 'sigedin_seguridad'
    },

    "produccion": {
        host: '10.10.13.2',
        user: 'jburgos',
        password: '18131047Mn*',
        database: 'sigedin_seguridad'
    }

};

if (process.env.NODE_ENV == 'dev') {
    db.default = db.desarrollo;
    auth.default = auth.desarrollo;


} else {
    db.default = db.produccion
    auth.default = auth.produccion;
}





// var connection = mysql.createConnection(db.default);
// var conAuth = mysql.createConnection(auth.default);
// connection.connect();

// module.exports = {
//     connection,
//     conAuth
// };

var conDB = require('knex')({
    client: 'mysql',
    connection: db.default
});
var conAuth = require('knex')({
    client: 'mysql',
    connection: auth.default
});
module.exports = { conDB, conAuth };