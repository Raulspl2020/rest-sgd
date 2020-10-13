const db = {

    "desarrollo": {
        host: '190.217.113.102',
        user: 'dvn',
        password: 'duvan07+',
        database: 'sgd'
    },

    "produccion": {
        host: process.env.MYSQL_DB_HOST,
        user: process.env.MYSQL_DB_USER,
        password: process.env.MYSQL_DB_PASS,
        database: process.env.MYSQL_DB_DATABASE
    }

};

const auth = {

    "desarrollo": {
        host: '190.217.113.102',
        user: 'dvn',
        password: 'duvan07+',
        database: 'sigedin_seguridad'
    },

    "produccion": {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_DATABASE
    }

};

if (process.env.NODE_ENV == 'dev') {
    db.default = db.desarrollo;
    auth.default = auth.desarrollo;

} else {
    db.default = db.produccion
    auth.default = auth.produccion;
}

var conDB = require('knex')({
    client: 'mysql',
    connection: db.default
});
var conAuth = require('knex')({
    client: 'mysql',
    connection: auth.default
});
module.exports = { conDB, conAuth };