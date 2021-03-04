import { response } from "express";
import { validarGoogleIdToken } from "../helpers/google-verify-token";
import * as loginProvider from "../provider/login_provider";
import { getUserRol } from '../provider/usuario_provider';
import { enviaMail } from "../helpers/mail";
import path from "path";
import { generarJWT, comprobarJWT, decodingJWT } from "../helpers/jwt";
import { Usuario } from "../models/Usuario";

//====================
//   /login/googleauth 
//=====================
export const googleAuth = async (req: any, res: any) => {
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
        const userDb = await loginProvider.getUserGoogle(googleUser.email);

        if (userDb[0].length > 0) {
            let roles = userDb[0];
            let tipo_user: any = [];

            roles.forEach((element: any) => {
                tipo_user.push(element['description']);
            });


            let usuario: Usuario = { id: roles[0].login, nombre: roles[0].name, picture: googleUser.picture, email: roles[0].email, active: roles[0].active, google: true, rol: tipo_user };




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


export const googleView = async (req: any, res: any) => {
    res.render("login_google");
};

//====================
//   /login/auth 
//=====================
export const auth = async (req: any, res: any = response) => {
    const { user, pass } = req.body;
    let data: any = {};
    let codeStatus: number = 200;

    try {
        let row = await loginProvider.validar(user, pass);
        let roles = row[0];
        let tipo_user: any = [];

        console.log(row[0].length);

        if (row[0].length > 0) {

            roles.forEach((element: any) => {
                tipo_user.push(element['description']);
            });

            let usuario: Usuario = { id: roles[0].login, nombre: roles[0].name, email: roles[0].email, active: roles[0].active, google: false, rol: tipo_user };

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
        return res.status(501).json({
            error: true,
            message: error,
        });
    }
};



//====================
//   /login/renewtoken 
//=====================
export const renewToken = async (req: any, res = response) => {
    let tokenOld = req.body.token;
    let data = {};
    try {
        const dataToken = await decodingJWT(tokenOld);
        let refrehsToken = null;

        let row = await getUserRol(dataToken.usuario.id);
        let roles = row[0];
        console.log(roles);
        let tipo_user: any = [];
        let codeStatus;



        if (row[0].length > 0) {
            roles.forEach((element: any) => {
                tipo_user.push(element['description']);
            });


            let usuario: Usuario = { id: roles[0].login, nombre: roles[0].name, email: roles[0].email, active: roles[0].active, google: false, rol: tipo_user };



            refrehsToken = await generarJWT(usuario);
            codeStatus = 202;
            data = {
                error: false,
                usuario,
                refrehsToken

            }
        } else {
            data = {
                message: "Usuario no encontrado",
                error: true,
            };
            codeStatus = 401;
        }


        return res.status(codeStatus).json(data);

    } catch (dataErr) {
        return res.status(500).json({
            error: true,
            message: "No se ha podido renovar el token",
            dataErr
        });
    }

    //  const usuario = await Usuario.findById(uid);
};

//====================
//   /login/recuperacion 
//=====================
export const correoRecuperacion = async (req: any, res: any) => {
    let body = req.body;
    let user: any = {};
    console.log(body);
    try {
        if (Object.entries(body).length > 2) {
            user = body;
        } else {
            user = await loginProvider.getUser(body.login);
            user = JSON.parse(JSON.stringify(user));
        }

        let tokenMail = await generarJWT(user, "900000");
        console.log("listo para enviar: " + process.env.BASE_URL.toString());
        var baseurl = process.env.BASE_URL.toString() + "/login/viewresetpass/" + tokenMail;
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


        let mailOptions = {
            'from': `Sigedin-ITP <${mailAuth.user}>`,
            'to': dataMail.enviar_a,
            'subject': dataMail.asunto,
            // 'html': dataMail.mensaje
            'text': dataMail.mensaje
        };


        if (process.env.EMAIL_KEY != dataMail.key) {
            res.status(401).json({
                message: "Usuario no autorizado",
                error: true,
            });
            return;
        }

        let response = await enviaMail(mailOptions, mailAuth);
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
export const saveNewPass = async (req: any, res: any) => {
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
        let result = await loginProvider.updatePass(dataToken.usuario, body.pass);
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
export const resetPass = async (req: any, res: any) => {
    let tokenMail = req.params.token;

    let [valido, data] = await comprobarJWT(tokenMail);
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

// export {
//     googleAuth,
//     auth,
//     renewToken,
//     correoRecuperacion,
//     resetPass,
//     saveNewPass,
//     googleView,
// };