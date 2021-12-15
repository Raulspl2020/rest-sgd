"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPass = exports.saveNewPass = exports.correoRecuperacion = exports.renewToken = exports.renovarToken = exports.auth = exports.googleView = exports.googleAuth = void 0;
const express_1 = require("express");
const google_verify_token_1 = require("../helpers/google-verify-token");
const loginProvider = __importStar(require("../provider/login_provider"));
const mail_1 = require("../helpers/mail");
const jwt_1 = require("../helpers/jwt");
const login_provider_1 = require("../provider/login_provider");
const Sesion_1 = __importDefault(require("../models/Mongo/Sesion"));
const uuid_1 = require("uuid");
//====================
//   /login/googleauth 
//=====================
exports.googleAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let token = null;
    if (!req.query.token) {
        token = req.body.token;
    }
    else {
        token = req.query.token;
    }
    if (!token) {
        return res.json({
            error: true,
            message: "Token requerido",
        });
    }
    const googleUser = yield google_verify_token_1.validateGoogleIdToken(token);
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
        const userDb = yield loginProvider.getUserGoogle(googleUser.email);
        if (userDb[0].length > 0) {
            const session_id = uuid_1.v4();
            let scopes = [];
            let roles = userDb[0];
            let tipo_user = [];
            roles.forEach((element) => {
                tipo_user.push(element['description']);
            });
            let scopesDD = yield login_provider_1.getServiceByRol(tipo_user);
            scopesDD.forEach((element) => {
                scopes.push(element['cod_service']);
            });
            let usuario = {
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
            let newJWT = yield jwt_1.generarJWT(usuario);
            let { exp } = yield jwt_1.decodingJWT(newJWT);
            const sesion = new Sesion_1.default({
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
        }
        else {
            console.log(userDb);
            res.status(401).json({
                error: true,
                message: "Usuario no encontrado",
            });
        }
    }
    catch (error) {
        console.log(error);
        res.json({
            error: true,
            message: error.message,
        });
    }
});
exports.googleView = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render("login_google");
});
//====================
//   /login/auth 
//=====================
exports.auth = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, pass } = req.body;
    let data = {};
    let codeStatus = 200;
    try {
        let row = yield loginProvider.validar(user, pass);
        let roles = row[0];
        let tipo_user = [];
        console.log(row[0].length);
        if (row[0].length > 0) {
            const session_id = uuid_1.v4();
            let scopes = [];
            roles.forEach((element) => {
                tipo_user.push(element['description']);
            });
            let scopesDD = yield login_provider_1.getServiceByRol(tipo_user);
            scopesDD.forEach((element) => {
                scopes.push(element['cod_service']);
            });
            let usuario = {
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
            let token = yield jwt_1.generarJWT(usuario);
            //guardar token en DB
            let { exp } = yield jwt_1.decodingJWT(token);
            const sesion = new Sesion_1.default({
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
        }
        else {
            data = {
                message: "Usuario o contraseña incorrectos",
                error: true,
            };
            codeStatus = 401;
        }
        res.status(codeStatus).json(data);
    }
    catch (error) {
        return res.status(501).json({
            error: true,
            message: error,
        });
    }
});
//devuelve un nuevo token a partir de uno anterior 
exports.renovarToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario } = yield jwt_1.decodingJWT(token);
        let refrehsToken = yield jwt_1.generarJWT(usuario);
        return refrehsToken;
    }
    catch (error) {
        console.log(error);
        throw new Error(error);
    }
});
//====================
//   /login/renewtoken 
//=====================
exports.renewToken = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let tokenOld = req.body.token;
    let data = {};
    try {
        let refreshToken = null;
        const { usuario, exp } = yield jwt_1.decodingJWT(tokenOld);
        let [esValido, data] = jwt_1.comprobarJWT(tokenOld);
        if (esValido) {
            console.log("vamos a buscar el la DB");
            let sesion = yield Sesion_1.default.findOne({ sesion_id: usuario.sesion_id, token: tokenOld });
            console.log(sesion);
            if (!sesion) {
                return res.status(401).json({
                    error: true,
                    message: "Sesion expirada"
                });
            }
            else {
                //renovar token
                refreshToken = yield jwt_1.generarJWT(usuario);
                const { exp } = yield jwt_1.decodingJWT(refreshToken);
                sesion.token = refreshToken;
                sesion.fecha_caducidad = new Date(exp * 1000);
                yield sesion.save();
                return res.status(201).json({
                    error: false,
                    usuario,
                    refreshToken
                });
            }
        }
        else {
            //renovar token solo si ya expiro
            if (data.name === 'TokenExpiredError') {
                console.log("el token expiro");
                let sesion = yield Sesion_1.default.findOne({ token: tokenOld });
                if (!sesion) {
                    return res.status(401).json({
                        error: true,
                        message: "Sesion expirada"
                    });
                }
                else {
                    refreshToken = yield jwt_1.generarJWT(usuario);
                    const { exp } = yield jwt_1.decodingJWT(refreshToken);
                    sesion.token = refreshToken;
                    sesion.fecha_caducidad = new Date(exp * 1000);
                    yield sesion.save();
                    return res.status(201).json({
                        error: false,
                        usuario,
                        refreshToken
                    });
                }
            }
            else {
                return res.status(401).json({
                    error: true,
                    data,
                    message: "Token invalido, no se ha podido renovar el token"
                });
            }
        }
    }
    catch (det_error) {
        return res.status(500).json({
            error: true,
            message: "No se ha podido renovar el token",
            det_error: det_error.message
        });
    }
    //  const usuario = await Usuario.findById(uid);
});
//====================
//   /login/recuperacion 
//=====================
exports.correoRecuperacion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    let user = {};
    console.log(body);
    try {
        user = yield loginProvider.getUser(body.login);
        let tokenMail = yield jwt_1.generarJWT(user, "900000");
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
        let response = yield mail_1.enviaMail(mailOptions, mailAuth);
        console.log("imprimendo respuesta");
        console.log(response);
        if (!response) {
            res.status(401).json({
                message: response,
                error: true,
            });
        }
        else {
            res.status(200).json({
                message: "E-mail de recuperación enviado exitosamente",
                error: false,
                token: tokenMail,
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al enviar el email",
            data: error,
            error: true,
        });
    }
});
//====================
//   /login/savenewpass 
//=====================
exports.saveNewPass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    let tokenMail = req.body.token;
    try {
        let [valido, dataToken] = jwt_1.comprobarJWT(tokenMail);
        // var dataToken = await token.verificaToken(body.token);
        if (!valido) {
            res.status(200).json({
                error: true,
                message: "Token no válido",
            });
        }
        console.log(dataToken);
        let result = yield loginProvider.updatePass(dataToken.usuario.login, body.pass);
        res.status(200).json({
            error: false,
            message: "Guardado exitosamente",
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            error: true,
            message: "Error al actualizar el registro",
            data: error.message,
        });
    }
});
//======================================
// VISTAS
//======================================
//====================
//   /login/viewresetpass/:token 
//=====================
exports.resetPass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let tokenMail = req.params.token;
    let [valido, data] = yield jwt_1.comprobarJWT(tokenMail);
    console.log(valido, data);
    //si no es valido
    if (!valido) {
        res.render("token_error", data);
    }
    else {
        data["url_sigedin"] = "https://sigedin.itp.edu.co/";
        data["BASE_URL"] = process.env.BASE_URL.toString();
        data["token"] = tokenMail;
        res.render("form_resset_pass", data);
    }
});
//# sourceMappingURL=login.js.map