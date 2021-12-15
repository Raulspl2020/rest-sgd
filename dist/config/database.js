"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conMongo = exports.conSysApolo = exports.conAuth = exports.conDB = void 0;
const knex_1 = __importDefault(require("knex"));
const mssql_1 = require("mssql");
const mongoose_1 = __importDefault(require("mongoose"));
const db = {
    desarrollo: {
        host: process.env.MYSQL_DEV_SGD_HOST,
        user: process.env.MYSQL_DEV_SGD_USER,
        password: process.env.MYSQL_DEV_SGD_PASS,
        database: process.env.MYSQL_DEV_SGD_DATABASE,
        port: 3306,
    },
    produccion: {
        host: process.env.MYSQL_PROD_SGD_HOST,
        user: process.env.MYSQL_PROD_SGD_USER,
        password: process.env.MYSQL_PROD_SGD_PASS,
        database: process.env.MYSQL_PROD_SGD_DATABASE,
        port: 3306,
    },
};
const auth = {
    desarrollo: {
        host: process.env.MYSQL_DEV_AUTH_HOST,
        user: process.env.MYSQL_DEV_AUTH_USER,
        password: process.env.MYSQL_DEV_AUTH_PASS,
        database: process.env.MYSQL_DEV_AUTH_DATABASE,
        port: 3306,
    },
    produccion: {
        host: process.env.MYSQL_PROD_AUTH_HOST,
        user: process.env.MYSQL_PROD_AUTH_USER,
        password: process.env.MYSQL_PROD_AUTH_PASS,
        database: process.env.MYSQL_PROD_AUTH_DATABASE,
        port: 3306,
    },
};
if (process.env.NODE_ENV == "pro") {
    db.default = db.produccion;
    auth.default = auth.produccion;
}
else {
    db.default = db.desarrollo;
    auth.default = auth.desarrollo;
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
const sqlConfig = {
    user: process.env.MSSQL_DEV_USER,
    password: process.env.MSSQL_DEV_PASS,
    server: process.env.MSSQL_DEV_SERVER.toString(),
    database: process.env.MSSQL_DEV_DATABASE,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false,
        trustServerCertificate: false // change to true for local dev / self-signed certs
    }
};
//establece una coneccion con sqlserver
const conSysApolo = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let conexion = yield mssql_1.connect(sqlConfig);
        return conexion;
    }
    catch (err) {
        console.log(err);
        return null;
    }
});
exports.conSysApolo = conSysApolo;
const mongo_cnn_url = () => {
    return `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_DB_PORT}/${process.env.MONGO_DB_NAME}`;
};
//conectar a base de datos mongo
const conMongo = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("starting connection", mongo_cnn_url());
        yield mongoose_1.default.connect(mongo_cnn_url());
        console.log("base de datos MONGO online");
    }
    catch (error) {
        throw new Error("Error de conexion: " + error);
    }
});
exports.conMongo = conMongo;
//# sourceMappingURL=database.js.map