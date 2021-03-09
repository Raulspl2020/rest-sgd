"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conAuth = exports.conDB = void 0;
const knex_1 = __importDefault(require("knex"));
const db = {
    desarrollo: {
        host: "190.217.113.102",
        user: "dvn",
        password: "duvan07+",
        database: "sigedin_ies",
        port: 3306,
    },
    produccion: {
        host: process.env.MYSQL_DB_HOST,
        user: process.env.MYSQL_DB_USER,
        password: process.env.MYSQL_DB_PASS,
        database: process.env.MYSQL_DB_DATABASE,
        port: 3306,
    },
};
const auth = {
    desarrollo: {
        host: "190.217.113.102",
        user: "dvn",
        password: "duvan07+",
        database: "sigedin_seguridad",
        port: 3306,
    },
    produccion: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_DATABASE,
        port: 3306,
    },
};
if (process.env.NODE_ENV == "dev") {
    db.default = db.desarrollo;
    auth.default = auth.desarrollo;
}
else {
    console.log(db);
    console.log("El entorno es: " + process.env.NODE_ENV);
    console.log(process.env.NODE_ENV);
    db.default = db.produccion;
    auth.default = auth.produccion;
}
let conDB = knex_1.default({
    client: "mysql",
    connection: db.default,
});
exports.conDB = conDB;
let conAuth = knex_1.default({
    client: "mysql",
    connection: auth.default,
});
exports.conAuth = conAuth;
//# sourceMappingURL=database.js.map