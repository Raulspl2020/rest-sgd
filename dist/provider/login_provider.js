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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePass = exports.getUserGoogle = exports.getUser = exports.validar = void 0;
const database_1 = require("../config/database");
let md5 = require('md5');
exports.validar = (user, pass) => __awaiter(void 0, void 0, void 0, function* () {
    let sql = `SELECT
    sec_users.login
    ,sec_users.name
    ,sec_users.email
    ,sec_users_groups.group_id
    ,sec_groups.description
    ,IF(sec_users.active='Y','true','false') AS active
    FROM
        sec_users_groups
    INNER JOIN
    sec_users ON (sec_users_groups.login = sec_users.login)
    INNER JOIN 
    sec_groups ON(sec_users_groups.group_id = sec_groups.group_id)
    WHERE (sec_users.login = ? OR sec_users.email=? OR sec_users.email_institucion=? )
    AND sec_users.pswd =  MD5(?)`;
    return yield database_1.conAuth.raw(sql, [user, user, user, pass]);
});
exports.getUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    let query = database_1.conAuth
        .where({ 'login': user })
        .orWhere({ 'email': user })
        .select('login', 'name', 'email', 'active', 'activation_code')
        .from("sec_users").first().then((result) => {
        console.log("aqui esta el result");
        console.log(result);
    });
    return query;
});
exports.getUserGoogle = (user) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("el usuario es: " + user);
    let sql = `SELECT
    sec_users.login
    ,sec_users.name
    ,sec_users.email
    ,sec_users_groups.group_id
    ,sec_groups.description
    ,IF(sec_users.active='Y','true','false') AS active
    FROM
        sec_users_groups
    INNER JOIN
    sec_users ON (sec_users_groups.login = sec_users.login)
    INNER JOIN 
    sec_groups ON(sec_users_groups.group_id = sec_groups.group_id)
    WHERE (sec_users.login = ? OR sec_users.email=? OR sec_users.email_institucion=?)`;
    return yield database_1.conAuth.raw(sql, [user, user, user]);
});
exports.updatePass = (user, pass) => __awaiter(void 0, void 0, void 0, function* () {
    return yield database_1.conAuth("sec_users")
        .where("login", user.login)
        .update({ pswd: md5(pass) });
});
//# sourceMappingURL=login_provider.js.map