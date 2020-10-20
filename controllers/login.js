const { response } = require("express");
const { validarGoogleIdToken } = require("../helpers/google-verify-token");
const login_model = require("../models/login_model");
const { enviaMail } = require("../helpers/mail");
const path = require("path");
const { generarJWT, comprobarJWT } = require("../helpers/jwt");
let { Usuario } = require("../models/Usuario");

//====================
//   /login/auth 
//=====================
const googleAuth = async(req, res) => {
    let token = req.body.token;

    if (!token) {
        return res.json({
            error: true,
            message: "Token requerido",
        });
    }

    const googleUser = await validarGoogleIdToken(token);

    if (!googleUser) {
        return res.status(401).json({
            error: true,
            message: "Token no válido",
        });
    }
    //verificar si existe usuario

    try {
        //const userDb = await login_model.getUser(googleUser.email);
        const userDb = await login_model.getUserGoogle(googleUser.email);

        if (userDb[0].length > 0) {
            let roles = userDb[0];
            let tipo_user = [];

            roles.forEach(element => {
                tipo_user.push(element['description']);
            });

            let usuario = new Usuario({
                'id': roles[0].login,
                'nombre': googleUser.name,
                'picture': googleUser.picture,
                'email': googleUser.email,
                'active': roles[0].active,
                'google': true,
                rol: tipo_user
            });

            let newJWT = await generarJWT(usuario);
            res.json({
                error: false,
                usuario: usuario,
                token: newJWT,
            });
        } else {
            console.log(userDb);
            res.status(401).json({
                error: true,
                message: "Usuario no encontrado",
            });
        }
    } catch (error) {
        res.json({
            error: true,
            message: error.message,
        });
    }
};


const googleView = async(req, res) => {
    res.render("login_google");
};

//====================
//   /login/auth 
//=====================
const auth = async(req, res = response) => {
    const { user, pass } = req.body;
    let data = {};
    let codeStatus = 200;

    //console.log(req.body);

    try {
        let row = await login_model.validar(user, pass);
        let roles = row[0];
        let tipo_user = [];



        if (row[0].length > 0) {
            roles.forEach(element => {
                tipo_user.push(element['description']);
            });

            let usuario = new Usuario({
                'id': roles[0].login,
                'nombre': roles[0].name,
                'email': roles[0].email,
                'active': roles[0].active,
                'google': false,
                rol: tipo_user
            });

            let saludo = "Bienvenido";
            let token = await generarJWT(usuario);

            data = {
                usuario,
                message: `${saludo} ${row[0][0].name}`,
                error: false,
                token: token,
            };
            codeStatus = 202;
        } else {
            data = {
                message: "Usuario o contraseña incorrectos",
                error: true,
            };
            codeStatus = 401;
        }

        res.status(codeStatus).json(data);
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error,
        });
    }
};




//corregir esto
const renewToken = async(req, res = response) => {
    const uid = req.uid;
    const token = await generarJWT(uid);
    const usuario = await Usuario.findById(uid);

    res.json({
        ok: true,
        token,
        usuario,
    });
};

//====================
//   /login/recuperacion 
//=====================
const correoRecuperacion = async(req, res) => {
    let body = req.body;
    let user = {};

    console.log(body);
    try {
        if (Object.entries(body).length > 2) {
            user = body;
        } else {
            user = await login_model.getUser(body.login);
            user = JSON.parse(JSON.stringify(user));
        }

        let tokenMail = await generarJWT(user, "900000");
        console.log("listo para enviar: " + process.env.BASE_URL.toString());
        var baseurl =
            process.env.BASE_URL.toString() + "/viewresetpass/" + tokenMail;
        console.log(baseurl);

        const mailAuth = {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
        };

        var dataMail = {
            from_name: body.from_name,
            enviar_a: user.email,
            asunto: "Recuperacion de contraseña Sigedin",
            mensaje: `Clic en este enlace para cambiar tu contraseña: ${baseurl}`,
            key: body.key,
        };

        if (process.env.EMAIL_KEY != dataMail.key) {
            res.status(401).json({
                message: "Usuario no autorizado",
                error: true,
            });
            return;
        }

        let response = await enviaMail(dataMail, mailAuth);
        console.log("imprimendo respuesta");
        console.log(response);
        if (!response) {
            res.status(401).json({
                message: response,
                error: true,
            });
        } else {
            res.status(200).json({
                message: "E-mail de recuperación enviado exitosamente",
                error: false,
                token: tokenMail,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error al enviar el email",
            data: error,
            error: true,
        });
    }
};

//====================
//   /login/savenewpass 
//=====================
const saveNewPass = async(req, res) => {
    let body = req.body;
    let tokenMail = req.body.token;
    try {
        let [valido, dataToken] = comprobarJWT(tokenMail);
        // var dataToken = await token.verificaToken(body.token);

        if (!valido) {
            res.status(200).json({
                error: true,
                message: "Token no válido",
            });
        }

        console.log(dataToken);
        var result = await login_model.updatePass(dataToken.usuario, body.pass);
        res.status(200).json({
            error: false,
            message: "Guardado exitosamente",
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: "Error al actualizar el registro",
            data: error.message,
        });
    }
};

//======================================
// VISTAS
//======================================


//====================
//   /login/viewresetpass/:token 
//=====================
const resetPass = async(req, res) => {
    let tokenMail = req.params.token;

    let [valido, data] = comprobarJWT(tokenMail);
    console.log(valido, data);

    //si no es valido
    if (!valido) {
        res.render("token_error", data);
    } else {
        data["url_sigedin"] = "https://sigedin.itp.edu.co/";
        data["BASE_URL"] = process.env.BASE_URL.toString();
        data["token"] = tokenMail;
        res.render("form_resset_pass", data);
    }
};

module.exports = {
    googleAuth,
    auth,
    renewToken,
    correoRecuperacion,
    resetPass,
    saveNewPass,
    googleView,
};