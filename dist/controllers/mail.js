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
exports.sendReciboPagoByID = exports.consultaCorreo = exports.enviaEMail = void 0;
const mail_1 = require("../helpers/mail");
const express_1 = require("express");
const estudianteProvider = __importStar(require("../provider/estudiante_provider"));
//====================
//   /mail/enviacorreo
//=====================
exports.enviaEMail = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    let fileBuffer = [];
    //validamos si hay archivo adjunto
    if (!req.files) {
        fileBuffer = null;
    }
    else {
        let files = req.files.archivo;
        files.forEach((element, index) => {
            fileBuffer[index] = {
                filename: element.name,
                content: element.data,
            };
        });
    }
    const mailAuth = {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    };
    console.log(mailAuth);
    let dataMail = {
        from_name: body.from_name,
        enviar_a: body.enviar_a,
        asunto: body.asunto,
        mensaje: body.mensaje,
        key: body.key,
    };
    if (process.env.EMAIL_KEY != dataMail.key) {
        res.status(401).json({
            message: "Usuario no autorizado",
            error: true,
        });
        return;
    }
    let mailOptions = {
        from: `Sigedin-ITP <${mailAuth.user}>`,
        to: dataMail.enviar_a,
        subject: dataMail.asunto,
        // 'html': dataMail.mensaje
        text: dataMail.mensaje,
        attachments: fileBuffer,
    };
    try {
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
                message: "E-mail enviado exitosamente",
                error: false,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Error al enviar el email",
            data: error,
            error: true,
        });
    }
});
//====================
//   /mail/consulta_correo
//=====================
exports.consultaCorreo = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let ide_estudiante = req.params.ide_estudiante;
    let data = {};
    try {
        let result = yield estudianteProvider.getCorreoEstudiante(ide_estudiante);
        if (result != undefined) {
            return res.status(200).json({
                error: false,
                data: result,
            });
        }
        else {
            data = {
                message: "No se encontraron resultados",
                error: true,
            };
            res.status(400).json(data);
        }
    }
    catch (error) {
        res.json({
            error: true,
            message: error.message,
        });
    }
});
// envia correo con recibo de pago adjunto:
exports.sendReciboPagoByID = (cliente, filePDF, descripcion, id_fac) => __awaiter(void 0, void 0, void 0, function* () {
    let body = {};
    let fileBuffer = [];
    try {
        fileBuffer.push({
            filename: `${cliente.ide_persona}_${id_fac}.pdf`,
            content: filePDF,
        });
        const urlDescarga = `${process.env.BASE_URL.toString()}/page/DescargarReciboPago/${id_fac}`;
        const mailAuth = {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
        };
        const message = `
Apreciado cliente: ${cliente.nom1_persona} ${cliente.ape1_persona}

Reciba un cordial saludo.
    
En el archivo adjunto encontrará los detalles de: ${descripcion}. Para abrir el archivo PDF, por favor utilice como clave los dígitos del número de identificación del cliente. En caso de tener problemas con la descarga o visualizacion del archivo puede usar el siguiente enlace: ${urlDescarga}
    `;
        let dataMail = {
            from_name: body.from_name,
            enviar_a: cliente.email_persona,
            asunto: "Recibo de pago - Pago exitoso",
            mensaje: message
        };
        let mailOptions = {
            from: `Sigedin-ITP <${mailAuth.user}>`,
            to: dataMail.enviar_a,
            subject: dataMail.asunto,
            // 'html': dataMail.mensaje
            text: dataMail.mensaje,
            attachments: fileBuffer,
        };
        let response = yield mail_1.enviaMail(mailOptions, mailAuth);
        console.log("imprimendo respuesta");
        console.log(response);
        if (!response) {
            return false;
            console.log("No se ha podido enviar el correo");
        }
        else {
            console.log("E-mail enviado exitosamente");
            return true;
        }
    }
    catch (error) {
        console.log(error);
        return false;
    }
});
//# sourceMappingURL=mail.js.map