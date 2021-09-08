import { conAuth } from '../config/database';
let md5 = require('md5');
export const validar = async (user: any, pass: any) => {
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
    return await conAuth.raw(sql, [user, user, user, pass]);
};

export const getUser = async (user: any) => {
    let query = conAuth
        .where({ 'login': user })
        .orWhere({ 'email': user })
        .select('login', 'name', 'email', 'active', 'activation_code')
        .from("sec_users").first().then((result) => {
            console.log("aqui esta el result");
            console.log(result);
        });
    return query;

};

export const getUserGoogle = async (user: any) => {
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
    return await conAuth.raw(sql, [user, user, user]);
};

export const updatePass = async (user: any, pass: any) => {
    return await conAuth("sec_users")
        .where("login", user.login)
        .update({ pswd: md5(pass) });
};

//verifica si un usuario con token tiene permiso para consumir el servicio
export const authTokenService = async (cod_service: any, token: any) => {
    let result = await conAuth
        .select('api_service.id_service', 'api_service.cod_service', 'api_service.descripcion', 'sec_groups.description', 'sec_users.login')
        .from("api_service_group")
        .join("api_service", "api_service_group.service_id", "=", "api_service.id_service")
        .join("sec_groups", "api_service_group.service_group_id", "=", "sec_groups.group_id")
        .join("sec_users_groups", "sec_users_groups.group_id", "=", "sec_groups.group_id")
        .join("sec_users", "sec_users_groups.login", "=", "sec_users.login")
        .where({ 'sec_users.token': token, 'api_service.cod_service': cod_service })
        .groupBy('api_service_group.id_service_usuario');
    return result;
};


//guarda el token en la DB para mantener la sesion
export const guardarTokenUsuario = async (dataInsert: any) => {
    let result = await conAuth("api_session_user").insert(dataInsert);
    return result;
};



