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
exports.guardarTokenUsuario = exports.getServiceByRol = exports.authTokenService = exports.updatePass = exports.getUserGoogle = exports.getUser = exports.validar = void 0;
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
    let query = yield database_1.conAuth
        .where({ 'login': user })
        .orWhere({ 'email': user })
        .select('login', 'name', 'email', 'active', 'activation_code')
        .from("sec_users").first();
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
        .where("login", user)
        .update({ pswd: md5(pass) });
});
//verifica si un usuario con token tiene permiso para consumir el servicio
exports.authTokenService = (cod_service, token) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conAuth
        .select('api_service.id_service', 'api_service.cod_service', 'api_service.descripcion', 'sec_groups.description', 'sec_users.login')
        .from("api_service_group")
        .join("api_service", "api_service_group.service_id", "=", "api_service.id_service")
        .join("sec_groups", "api_service_group.service_group_id", "=", "sec_groups.group_id")
        .join("sec_users_groups", "sec_users_groups.group_id", "=", "sec_groups.group_id")
        .join("sec_users", "sec_users_groups.login", "=", "sec_users.login")
        .where({ 'sec_users.token': token, 'api_service.cod_service': cod_service })
        .groupBy('api_service_group.id_service_usuario');
    return result;
});
//obtiene los permisos que uno o mas roles tiene asignados
exports.getServiceByRol = (roles) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conAuth
        .select('sec_groups.group_id', 'sec_groups.description AS grupo', 'api_service.id_service', 'api_service.nombre', 'api_service.descripcion', 'api_service.cod_service')
        .from("api_service_group")
        .join("api_service", "api_service_group.service_id", "=", "api_service.id_service")
        .join("sec_groups", "api_service_group.service_group_id", "=", "sec_groups.group_id")
        .whereIn('sec_groups.description', roles)
        .groupBy('api_service.id_service');
    return result;
});
//guarda el token en la DB para mantener la sesion
exports.guardarTokenUsuario = (dataInsert) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conAuth("api_session_user").insert(dataInsert);
    return result;
});
//# sourceMappingURL=login_provider.js.map