const { conAuth } = require('../config/database');
var md5 = require('md5');
var validar = async(user, pass) => {

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

let getUser = async(user) => {
    console.log("el usuario es: " + user);
    let query = conAuth
        .where({ 'login': user })
        .orWhere({ 'email': user })
        .select('login', 'name', 'email', 'active', 'activation_code')
        .from("sec_users").first();
    return query;

};

let getUserGoogle = async(user) => {
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
    WHERE (sec_users.login = ? OR sec_users.email=? sec_users.email_institucion=?, )`;
    return conAuth.raw(sql, [user, user, user]);
};

let updatePass = (user, pass) => {
    return conAuth("sec_users")
        .where("login", user.login)
        .update({ pswd: md5(pass) });
};


module.exports = {
    validar,
    getUser,
    updatePass,
    getUserGoogle
};