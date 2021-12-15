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
exports.getTipoDoc = exports.updatePersonaCodeVerify = exports.updateDatauserContact = exports.getInfoUsuario = exports.contactoUsuatio = exports.auditoria = exports.getUserRol = void 0;
const database_1 = require("../config/database");
exports.getUserRol = (idUsuario) => __awaiter(void 0, void 0, void 0, function* () {
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
    WHERE (sec_users.login = ? OR sec_users.email=? OR sec_users.email_institucion=? )`;
    return yield database_1.conAuth.raw(sql, [idUsuario, idUsuario, idUsuario]);
});
exports.auditoria = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield database_1.conAuth
        .where({ 'username': id, 'action': 'login' })
        .select('id', 'inserted_date', 'username', 'ip_user')
        .from('sc_log_accesosistema');
});
exports.contactoUsuatio = (idUsuario) => __awaiter(void 0, void 0, void 0, function* () {
    let sql = `
    (SELECT col_persona.ide_persona, col_persona.tipo_doc, col_persona.nom1_persona AS nombre1,col_persona.nom2_persona AS nombre2,
        col_persona.ape1_persona AS apellido1,col_persona.ape2_persona AS apellido2, col_persona.email_persona, col_persona.cel_persona
        FROM col_persona
        WHERE col_persona.ide_persona = ?) UNION (
        SELECT col_persona.acud_identificacion AS ide_persona, COALESCE(col_persona.acud_tipo_doc,0 ) AS  tipo_doc,
         SUBSTRING_INDEX(SUBSTRING_INDEX( col_persona.acud_apellnombres, ' ', 1), ' ', -1) AS nombre11, "" AS nombre2,
          SUBSTRING_INDEX(SUBSTRING_INDEX( col_persona.acud_apellnombres, ' ', 3), ' ', -1) AS apellido1, "" AS apellido2,
        col_persona.email_persona, col_persona.acud_movil AS cel_persona
        FROM col_persona
        WHERE col_persona.acud_identificacion = ?
    )LIMIT 1
    `;
    return yield database_1.conDB.raw(sql, [idUsuario, idUsuario]);
});
//consulta la informacion basica de un estudiante 
exports.getInfoUsuario = (id) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB
        .select("col_persona.ide_persona", "col_persona.tipo_doc", "fech_nac_persona", "col_persona.email_persona", "col_persona.email_institucion", "col_persona.cel_persona", "col_persona.ide_genero", "col_persona.dir_persona", "col_tipodoc.siglas as des_tipo_doc", "col_persona.ape1_persona as apellido1", "col_persona.ape2_persona  as apellido2", "col_persona.nom1_persona as nombre1", "col_persona.nom2_persona as nombre2", "mun_nac.cod_municipio", "col_persona.codigo_activacion", "col_persona.email_verify", "mun_nac.cod_dep", "col_persona.fech_nac_persona", "col_persona.fec_expedicion_doc")
        .from("col_persona")
        .join("col_tipodoc", "col_persona.tipo_doc", "=", "col_tipodoc.tipo_doc")
        .join("col_municipios as mun_nac", "col_persona.cod_mpio_residencia", "=", " mun_nac.cod_municipio")
        .leftJoin("col_municipios", "col_persona.cod_mun_exp", "=", "col_municipios.cod_municipio")
        .where({ "col_persona.ide_persona": id });
    if (result.length > 0) {
        return result;
    }
    else {
        return [];
    }
});
//actualiza los datos de contacto en la DB
exports.updateDatauserContact = (ide_persona, data) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB("col_persona")
        .where("col_persona.ide_persona", ide_persona)
        .update(data);
    return result;
});
//actualiza los datos de contacto en la DB
exports.updatePersonaCodeVerify = (ide_persona, code) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB("col_persona")
        .where("col_persona.ide_persona", ide_persona)
        .update({
        'codigo_activacion': code
    });
    return result;
});
//consulta la informacion basica de un estudiante 
exports.getTipoDoc = (id) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB
        .select("*")
        .from("col_tipodoc")
        .where({ "tipo_doc": id })
        .first();
    return result;
});
//# sourceMappingURL=usuario_provider.js.map