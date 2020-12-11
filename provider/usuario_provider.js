const { conAuth } = require('../config/database');

let getUserRol = async(idUsuario) => {
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
    return await conAuth.raw(sql, [idUsuario, idUsuario, idUsuario]);
};
module.exports = {
    getUserRol
};