import { conAuth } from '../config/database';

export const getUserRol = async(idUsuario:string) => {
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
export const auditoria = async(id:string) => {

    return await conAuth
        .where({'username': id,'action':'login'})
        .select('id', 'inserted_date', 'username','ip_user')
        .from('sc_log_accesosistema');
};
