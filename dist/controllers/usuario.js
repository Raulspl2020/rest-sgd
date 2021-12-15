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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataCedula = exports.verifyTokenMail = exports.updateInfoUser = exports.changePassword = exports.updateContactUser = exports.getInfoBasicUsuario = exports.getInfoBasicUser = exports.getInfoUser = exports.getUserContacto = exports.getAuditoriaUsuario = void 0;
const express_1 = require("express");
const mail_1 = require("../helpers/mail");
const jwt_1 = require("../helpers/jwt");
const usuarioProvider = __importStar(require("../provider/usuario_provider"));
const usuario_provider_1 = require("../provider/usuario_provider");
const login_provider_1 = require("../provider/login_provider");
const login_provider_2 = require("../provider/login_provider");
const global_1 = require("../helpers/global");
//====================
//   /usuario/auditoria 
//=====================
exports.getAuditoriaUsuario = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    console.log(req);
    let ideUsuario = req.params.ideUsuario;
    usuarioProvider.auditoria(ideUsuario)
        .then(rows => {
        let json = {};
        if (rows.length) {
            json = {
                data: rows,
                rs: true,
            };
        }
        else {
            json = {
                msj: "No se encontraron resultados",
                rs: false
            };
        }
        res.json(json);
    });
});
//====================
//   /usuario/contacto 
//=====================
exports.getUserContacto = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    let ideUsuario = req.params.ideUsuario;
    try {
        let result = yield usuarioProvider.contactoUsuatio(ideUsuario);
        let json = {};
        if (result[0].length > 0) {
            res.status(200).json({
                message: json.msj,
                data: result[0][0],
                error: false,
            });
        }
        else {
            res.status(200).json({
                message: "No se encontraron resultados",
                error: true,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }
});
//====================
//   /usuario/contacto 
//=====================
exports.getInfoUser = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    let ideUsuario = req.params.ideUsuario;
    try {
        let result = yield usuarioProvider.getInfoUsuario(ideUsuario);
        let json = {};
        if (result[0].length > 0) {
            res.status(200).json({
                message: json.msj,
                data: result[0][0],
                error: false,
            });
        }
        else {
            res.status(200).json({
                message: "No se encontraron resultados",
                error: true,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error.message,
        });
    }
});
//====================
//   /usuario/infobasica/:id_user
//=====================
exports.getInfoBasicUser = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let body = req.body;
    let ideUsuario = req.params.ideUsuario;
    try {
        let result = yield usuarioProvider.getInfoUsuario(ideUsuario);
        console.log(result);
        let json = {};
        if (result.length > 0) {
            result[0].apellido2 = (result[0].apellido2 == null) ? "" : result[0].apellido2;
            result[0].nombre2 = result[0].nombre2 || "";
            result[0].email_persona = (_a = result[0].email_persona.trim()) !== null && _a !== void 0 ? _a : result[0].email_institucion.trim();
            result[0].cel_persona = result[0].cel_persona.trim();
            res.status(200).json({
                message: "Ejecución correcta",
                data: result[0],
                error: false,
            });
        }
        else {
            res.status(200).json({
                message: "No se encontraron resultados",
                error: true,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error.message,
        });
    }
});
//====================
//   /usuario/infobasica
//=====================
exports.getInfoBasicUsuario = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    let ideUsuario = req.params.ideUsuario;
    const usuario = req.usuario;
    try {
        let result = yield usuarioProvider.getInfoUsuario(usuario.id);
        console.log(result);
        if (result.length > 0) {
            result[0].apellido2 = (result[0].apellido2 == null) ? "" : result[0].apellido2;
            result[0].nombre2 = result[0].nombre2 || "";
            result[0].email_persona = (_b = result[0].email_persona.trim()) !== null && _b !== void 0 ? _b : result[0].email_institucion.trim();
            result[0].cel_persona = result[0].cel_persona.trim();
            res.status(200).json({
                message: "Ejecución correcta",
                data: result[0],
                error: false,
            });
        }
        else {
            res.status(404).json({
                message: "No se encontraron resultados",
                error: true,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error.message,
        });
    }
});
//====================
//   /usuario/contacto 
//=====================
exports.updateContactUser = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    const usuario = req.usuario;
    const body = req.body;
    try {
        const data = {
            cel_persona: body.cel_persona,
            email_persona: body.email_persona,
            dir_persona: body.dir_persona,
            email_institucion: body.email_institucion
        };
        let result = yield usuario_provider_1.updateDatauserContact(usuario.id, data);
        console.log(result);
        res.status(200).json({
            message: "Datos actualizados correctamente",
            error: false,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error.message,
        });
    }
});
//====================
//  POST /usuario/changepassword 
//=====================
exports.changePassword = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    const usuario = req.usuario;
    const body = req.body;
    try {
        const data = {
            password_old: body.password_old,
            password_new: body.password_new,
        };
        let row = yield login_provider_1.validar(usuario.id, data.password_old);
        if (row[0].length > 0) {
            let result = yield login_provider_2.updatePass(usuario.id, data.password_new);
            res.status(200).json({
                message: "Contraseña actualizada exitosamente",
                error: false,
                result
            });
        }
        else {
            res.status(406).json({
                message: "Contraseña anterior incorrecta",
                error: true,
            });
        }
    }
    catch (det_error) {
        console.log(det_error);
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error
        });
    }
});
//====================
//   /usuario/updateinfouser 
//=====================
exports.updateInfoUser = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    try {
        let codigo = parseInt((Math.random() * (9999 - 1000) + 1000).toString());
        let newJWT = yield jwt_1.generarJWT({
            'id_usuario': body.id_usuario,
            'email': body.email,
            'celular': body.celular,
            'direccion': body.direccion,
            'codigo': codigo
        }, '5m');
        usuario_provider_1.updatePersonaCodeVerify(body.id_usuario, codigo);
        const mailAuth = {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
        };
        let dataMail = {
            from_name: body.from_name,
            enviar_a: body.email,
            asunto: "Verificación correco electronico - Código: " + codigo,
            mensaje: `
Cordial saludo,

<p>Número de verificación: <strong><h3>${codigo}</h3></strong></p>

<p>Este correo electrónico se ha enviado de forma automática para confirmar la
identidad del usuario que ha solicitado registrar una dirección de correo electrónico en SIGEDIN.<p>

<p>
Para continuar con el registro en SIGEDIN de la dirección del correo electrónico ${body.email},
usa el numero de verificación o haz click sobre el boton.</p>

<a href="${process.env.BASE_URL}/usuario/verifytokenmail/${newJWT}" style="display:block;width:90%;max-width:350px;line-height:45px;border-radius:5px;background:#e67e22;color:white;text-align:center;margin:2em auto 1em" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://dashboard.epayco.co/api/registro/crear/cliente/5c72d08f77159a0930e5533e17512e21&amp;source=gmail&amp;ust=1630080987404000&amp;usg=AFQjCNG-Ejm3JqcXyREg5IOTHMVn2sHGbQ">Validar Correo</a>

<p>
*Si confirmas este correo electrónico desde iPhone o Android pulsa el
siguiente enlace para proceder con la confirmación. </p>

${process.env.BASE_URL}/usuario/verifytokenmail/${newJWT}
        `
        };
        let mailOptions = {
            'from': `Sigedin-ITP <${mailAuth.user}>`,
            'to': dataMail.enviar_a,
            'subject': dataMail.asunto,
            'html': dataMail.mensaje
            //'text': dataMail.mensaje
        };
        let response = yield mail_1.enviaMail(mailOptions, mailAuth);
        if (!response) {
            res.status(401).json({
                message: response,
                error: true,
            });
        }
        else {
            res.status(200).json({
                message: "E-mail de verificación enviado exitosamente, por favor revisa tu correo electrónico",
                error: false,
                token: newJWT,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Servicio no disponible temporalmente",
            error: true
        });
    }
});
//====================
//   /usuario/verifytokenmail 
//=====================
exports.verifyTokenMail = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    let tokenMail = req.params.token;
    let usuario = {};
    try {
        let [valido, dataToken] = jwt_1.comprobarJWT(tokenMail);
        if (valido) {
            usuario = dataToken === null || dataToken === void 0 ? void 0 : dataToken.usuario;
            usuario.mensaje = "";
            usuario.valido = valido;
            //actualizar datos en ña DB
            let dataDB = {
                'email_persona': usuario.email,
                'dir_persona': usuario.direccion,
                'cel_persona': usuario.celular,
                'email_verify': '1',
                'codigo_activacion': 0
            };
            if (usuario.direccion == '') {
                delete dataDB.dir_persona;
            }
            if (usuario.celular == '') {
                delete dataDB.cel_persona;
            }
            let resultDB = yield usuario_provider_1.updateDatauserContact(usuario.id_usuario, dataDB);
            res.render('estado_verificacion_email', usuario);
        }
        else {
            usuario.valido = valido;
            usuario.mensaje = "EL token de verificación o codigo de activación ha expirado";
            res.render('estado_verificacion_email', usuario);
        }
    }
    catch (error) {
        console.log(error);
        usuario.mensaje = "Servcio no disponible temporalmemte";
        res.render('estado_verificacion_email', usuario);
    }
});
//====================
//   /usuario/decodecedula 
//=====================
exports.getDataCedula = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    let cadena = body.cadenabase64;
    if (cadena.length < 20) {
        res.status(200).json({
            message: "Lectura errada, intente nuevamente",
            error: true,
            data: {},
        });
    }
    try {
        let buff = Buffer.from(cadena, 'base64');
        const decodeCadena = buff.toString('ascii');
        res.status(200).json({
            message: "Decodificación correcta",
            error: false,
            data: global_1.extractColDocumentData(decodeCadena),
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Servicio no disponible temporalmente ",
            error: true
        });
    }
});
//# sourceMappingURL=usuario.js.map