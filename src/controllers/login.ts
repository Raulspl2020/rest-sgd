import { response } from "express";
import { validarGoogleIdToken, validateGoogleIdToken } from "../helpers/google-verify-token";
import * as loginProvider from "../provider/login_provider";
import { getUserRol } from '../provider/usuario_provider';
import { enviaMail } from "../helpers/mail";
import path from "path";
import { generarJWT, comprobarJWT, decodingJWT } from "../helpers/jwt";
import { Usuario } from "../models/Usuario";
import { getServiceByRol, guardarTokenUsuario } from "../provider/login_provider";
import format from "date-format-parse/lib/format";
import Sesion from "../models/Mongo/Sesion";
import { v4 as uuidv4 } from 'uuid';

//====================
//   /login/googleauth 
//=====================
export const googleAuth = async (req: any, res: any) => {
    let token: string = null;
    if (!req.query.token) {
        token = req.body.token;
    } else {
        token = req.query.token;
    }

    if (!token) {
        return res.json({
            error: true,
            message: "Token requerido",
        });
    }

    const googleUser = await validateGoogleIdToken(token);
    console.log(googleUser);

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
            const session_id = uuidv4();
            let scopes: string[] = [];

            let roles = userDb[0];
            let tipo_user: any = [];

            roles.forEach((element: any) => {
                tipo_user.push(element['description']);
            });

            let scopesDD = await getServiceByRol(tipo_user);

            scopesDD.forEach((element: any) => {
                scopes.push(element['cod_service']);
            });



            let usuario: Usuario = {
                id: roles[0].login,
                nombre: roles[0].name,
                picture: googleUser.picture,
                email: roles[0].email,
                active: roles[0].active,
                google: true,
                rol: tipo_user,
                sesion_id: session_id,
                permisos: scopes
            };

            let newJWT = await generarJWT(usuario);

            let { exp } = await decodingJWT(newJWT);

            const sesion = new Sesion({
                token: newJWT,
                user_id: usuario.id,
                sesion_id: session_id,
                fecha_creacion: new Date(),
                fecha_caducidad: new Date(exp * 1000)
            });
            //no es necesario esperar que se guarde
            sesion.save();


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
        console.log(error);
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

            const session_id = uuidv4();
            let scopes: string[] = [];

            roles.forEach((element: any) => {
                tipo_user.push(element['description']);
            });

            let scopesDD = await getServiceByRol(tipo_user);

            scopesDD.forEach((element: any) => {
                scopes.push(element['cod_service']);
            });


            let usuario: Usuario = {
                id: roles[0].login,
                nombre: roles[0].name,
                email: roles[0].email,
                active: roles[0].active,
                google: false,
                sesion_id: session_id,
                rol: tipo_user,
                permisos: scopes
            };

            let saludo = "Bienvenido";
            let token: string = await generarJWT(usuario);
            //guardar token en DB

            let { exp } = await decodingJWT(token);

            const sesion = new Sesion({
                token: token,
                user_id: usuario.id,
                sesion_id: session_id,
                fecha_creacion: new Date(),
                fecha_caducidad: new Date(exp * 1000)
            });

            //no es necesario esperar que se guarde
            sesion.save();

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


//devuelve un nuevo token a partir de uno anterior 
export const renovarToken = async (token: string): Promise<string> => {

    try {
        const { usuario }: { usuario: Usuario } = await decodingJWT(token);
        let refrehsToken = await generarJWT(usuario);
        return refrehsToken;
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }

}



//====================
//   /login/renewtoken 
//=====================
export const renewToken = async (req: any, res = response) => {
    let tokenOld = req.body.token;
    let data = {};
    try {
        let refreshToken = null;
        const { usuario, exp }: { usuario: Usuario, exp: number } = await decodingJWT(tokenOld);
        let [esValido, data] = comprobarJWT(tokenOld);

        if (esValido) {
            console.log("vamos a buscar el la DB");
            let sesion = await Sesion.findOne({ sesion_id: usuario.sesion_id, token: tokenOld });
            console.log(sesion);
            if (!sesion) {
                return res.status(401).json({
                    error: true,
                    message: "Sesion expirada"
                });
            } else {
                //renovar token
                refreshToken = await generarJWT(usuario);
                const { exp } = await decodingJWT(refreshToken);

                sesion.token = refreshToken;
                sesion.fecha_caducidad = new Date(exp * 1000);
                await sesion.save();
                return res.status(201).json({
                    error: false,
                    usuario,
                    refreshToken
                });
            }
        } else {
            //renovar token solo si ya expiro
            if (data.name === 'TokenExpiredError') {
                console.log("el token expiro");

                let sesion = await Sesion.findOne({ token: tokenOld });
                if (!sesion) {
                    return res.status(401).json({
                        error: true,
                        message: "Sesion expirada"
                    });
                } else {

                    refreshToken = await generarJWT(usuario);
                    const { exp } = await decodingJWT(refreshToken);
                    sesion.token = refreshToken;
                    sesion.fecha_caducidad = new Date(exp * 1000);
                    await sesion.save();

                    return res.status(201).json({
                        error: false,
                        usuario,
                        refreshToken

                    });
                }

            } else {
                return res.status(401).json({
                    error: true,
                    data,
                    message: "Token invalido, no se ha podido renovar el token"
                });

            }
        }

    } catch (det_error) {
        return res.status(500).json({
            error: true,
            message: "No se ha podido renovar el token",
            det_error: det_error.message
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

        user = await loginProvider.getUser(body.login);

        let tokenMail = await generarJWT(user, "900000");
        console.log("listo para enviar: " + process.env.BASE_URL.toString());
        var baseurl = process.env.BASE_URL.toString() + "/login/viewresetpass/" + tokenMail;
        console.log(baseurl);

        const mailAuth = {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
        };

        let dataMail = {
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
        console.log(error);
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
        let result = await loginProvider.updatePass(dataToken.usuario.login, body.pass);
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

