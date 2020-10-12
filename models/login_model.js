const { conAuth } = require('../config/database');
var md5 = require('md5');
var validar = async(user, pass) => {

    let sql = `SELECT
    sec_users.login
    ,sec_users.name
    ,sec_users.email
    ,sec_users_groups.group_id
    ,sec_groups.description
    FROM
        sec_users_groups
    INNER JOIN
    sec_users ON (sec_users_groups.login = sec_users.login)
    INNER JOIN 
    sec_groups ON(sec_users_groups.group_id = sec_groups.group_id)
    WHERE sec_users.login = ?
    AND sec_users.pswd =  MD5(?)`;
    return conAuth.raw(sql, [user, pass]);
};

let getUser = async(user) => {
    console.log("el usuario es: "+user);
    let query = conAuth
    .where({ 'login': user })
     .orWhere({'email': user})
    .select('login', 'name', 'email', 'active', 'activation_code')
    .from("sec_users").first();
    console.log(query.toSQL().toNative());
    return query;
     
};

let updatePass = (user, pass) => {
    return conAuth("sec_users")
        .where("login", user.login)
        .update({ pswd: md5(pass) });
};


module.exports = {
    validar,
    getUser,
    updatePass
};