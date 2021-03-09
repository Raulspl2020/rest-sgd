import { conAuth, conDB  } from '../config/database';

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

export const contactoUsuatio = async (idUsuario:string) => {
    let  sql = `
    (SELECT col_persona.ide_persona, col_persona.tipo_doc, CONCAT_WS(' ',col_persona.nom1_persona,col_persona.nom2_persona) AS nombres,
    CONCAT_WS(' ',col_persona.ape1_persona,col_persona.ape2_persona) AS apellidos, col_persona.email_persona, col_persona.cel_persona
    FROM col_persona
    WHERE col_persona.ide_persona = ?) UNION (
    SELECT col_persona.acud_identificacion AS ide_persona, COALESCE(col_persona.acud_tipo_doc,0 ) AS  tipo_doc,
     SUBSTRING_INDEX(SUBSTRING_INDEX( col_persona.acud_apellnombres, ' ', 1), ' ', -1) AS nombres,
      SUBSTRING_INDEX(SUBSTRING_INDEX( col_persona.acud_apellnombres, ' ', 3), ' ', -1) AS apellidos,
    col_persona.email_persona, col_persona.acud_movil AS cel_persona
    FROM col_persona
    WHERE col_persona.acud_identificacion =?
    )
    LIMIT 1
    `;

    return await conDB.raw(sql, [idUsuario, idUsuario]);
};

