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
exports.complileTemplateReciboPago = exports.viewConsultaPago = exports.pdfReciboPago = exports.descargarPlantillaDesceunto = exports.htmlAdminDescuentoView = exports.htmlFacturaView = exports.pdfFacturaView = exports.consultaEstadoPagoView = exports.viewPDFPago = exports.pagoInscripcion = exports.pagoMatricula = exports.pagosvariosView = exports.pagoPersonalizado = exports.userUpdateContactView = exports.vistaHolaMundo = void 0;
const express_1 = require("express");
const global_1 = require("../helpers/global");
const stream_1 = __importDefault(require("stream"));
const path_1 = __importDefault(require("path"));
const pago_provider_1 = require("../provider/pago_provider");
const moneda = __importStar(require("currency-formatter"));
const date_format_parse_1 = require("date-format-parse");
const exphbs = require('express-hbs');
const qrcode_1 = __importDefault(require("qrcode"));
const factura_1 = require("./factura");
const mail_1 = require("./mail");
const usuario_provider_1 = require("../provider/usuario_provider");
const fs = require('fs');
const { DOMImplementation, XMLSerializer } = require('xmldom');
//====================
//   /page/inicio 
//=====================
exports.vistaHolaMundo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // try {
    //     let result = await consultarTercero();
    //     res.json(result);
    // } catch (error) {
    //     res.render("hola_mundo");
    // }
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    let body = req.body;
    let idFactura = req.params.ref;
    try {
        let exphbs = require('express-hbs');
        const hbs = fs.readFileSync('./views/pdf_recibo_pago.hbs', 'utf8');
        console.log(hbs);
        let template = exphbs.handlebars.compile(hbs);
        let factura = yield factura_1.getDataDetalleFacturaById(707);
        data.factura = factura;
        data.fecha_actual = date_format_parse_1.format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
        //data.fecha_actual = nDate;
        data.urlService = `${process.env.BASE_URL.toString()}/page/DescargarReciboPago/${factura.id}`;
        let resultHTML = template(data);
        console.log(resultHTML);
        let pdf = yield global_1.generarHTMLPDFNew(resultHTML);
        let resMail = mail_1.sendReciboPagoByID(factura.cliente, pdf, factura.categoria, factura.id);
        console.log(resMail);
        // res.send(pdf);
        let fileName = `${factura.cliente.ide_persona}_${factura.id}.pdf`;
        var readStream = new stream_1.default.PassThrough();
        readStream.end(pdf);
        res.set('Content-disposition', 'attachment; filename=' + fileName.toString());
        res.contentType("application/pdf");
        //   res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        console.log("Iniciando descarga");
        readStream.pipe(res);
    }
    catch (error) {
        console.log(error);
    }
});
//====================
//   /page/actualizarcontacto 
//=====================
exports.userUpdateContactView = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    let id_user = req.params.id_user;
    let resultDB = yield usuario_provider_1.getInfoUsuario(id_user);
    data.BASE_URL = process.env.BASE_URL.toString();
    data.user = resultDB[0];
    res.render("actualizar_contacto", data);
});
//====================
//   /page/PagoPersonalizado 
//=====================
exports.pagoPersonalizado = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("pago_general", data);
});
//====================
//   /page/pagosvarios 
//=====================
exports.pagosvariosView = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("pago_varios", data);
});
//====================
//   /page/pagoMatricula 
//=====================
exports.pagoMatricula = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let id_matricula = req.params.id_matricula;
    console.log(id_matricula);
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    data.ID_MATRICULA = id_matricula;
    res.render("pago_matricula", data);
});
//====================
//   /page/pagoinscripcion 
//=====================
exports.pagoInscripcion = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let id_matricula = req.params.id_matricula;
    console.log(id_matricula);
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    data.ID_MATRICULA = id_matricula;
    res.render("pago_inscripcion", data);
});
//====================
//   /page/GenerarPagoCodigoBarras 
//=====================
exports.viewPDFPago = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let codigo = req.params.codigo;
    res.render("pdf_pago_inscripcion");
});
//====================
//   /page/ConsultaEstadoPago 
//=====================
exports.consultaEstadoPagoView = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("consulta_pago", data);
});
//====================
//   /page/DetalleFactura/:ref/:tipo 
//=====================
exports.pdfFacturaView = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("pdf_factura", data, (err, html) => __awaiter(void 0, void 0, void 0, function* () {
        let pdf = yield global_1.generarHTMLPDFNew(html);
        res.contentType("application/pdf");
        res.send(pdf);
    }));
});
//====================
//   /page/DetalleFactura/:ref
//=====================
exports.htmlFacturaView = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("pdf_factura", data);
});
//====================
//   /page/admindescuento
//=====================
exports.htmlAdminDescuentoView = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("admin_descuentos", data);
});
//====================
//   /page/descargarplantilladesceunto
//=====================
exports.descargarPlantillaDesceunto = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    const uploadPath = path_1.default.join(__dirname, '../../public/format/plantilla-descuentos.xlsx');
    return res.download(uploadPath);
});
//====================
//   /page/DescargarReciboPago/:ref
//=====================
exports.pdfReciboPago = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    let body = req.body;
    let idFactura = req.params.ref;
    try {
        let factura = yield factura_1.getDataDetalleFacturaById(idFactura);
        console.log(factura);
        //crear un nuevo pago
        if (factura.pagos.length > 0) {
            factura.pagos.forEach((item) => {
                item.total_pago = "$ " + moneda.format(item.total_pago, { locale: 'es-CO' }).replace('$', '').trim();
                item.valor_pago = "$ " + moneda.format(item.valor_pago, { locale: 'es-CO' }).replace('$', '').trim();
            });
        }
        data.factura = factura;
        data.fecha_actual = date_format_parse_1.format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
        //data.fecha_actual = nDate;
        data.urlService = `${process.env.BASE_URL.toString()}/page/DescargarReciboPago/${factura.id}`;
        qrcode_1.default.toDataURL(data.urlService, { errorCorrectionLevel: "L" }, (err, src) => {
            if (err)
                res.send("Error occured");
            data.scrQR = src;
            res.render("pdf_recibo_pago", data, (err, html) => __awaiter(void 0, void 0, void 0, function* () {
                let pdf = yield global_1.generarHTMLPDFNew(html);
                res.contentType("application/pdf");
                res.send(pdf);
            }));
        });
    }
    catch (error) {
        res.send(error.message);
    }
});
//====================
//   /page/pagoinscripcion 
//=====================
exports.viewConsultaPago = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    // const buffer = canvas.toBuffer('application/pdf')
    // fs.writeFileSync('./image.pdf', buffer)
    // //convert your PDF to a Blob and save to file
    // canvas.stream.on('finish', function () {
    //     var blob = canvas.stream.toBlob('application/pdf');
    //    // saveAs(blob, 'example.pdf', true);
    //     fs.writeFileSync('./image.pdf', blob)
    // });
    // canvas.end();
    let codigo = req.params.codigo;
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    data.CODIGO_PAGO = codigo;
    res.render("estado_pago", data);
});
//crea un recibo de pago en pdf y lo envia al correo
exports.complileTemplateReciboPago = (id_factura, prioridad = false) => __awaiter(void 0, void 0, void 0, function* () {
    let data = {};
    data.BASE_URL = process.env.BASE_URL.toString();
    try {
        //leer el contenido del archivo para despues ser compilado
        const hbs = fs.readFileSync('./views/pdf_recibo_pago.hbs', 'utf8');
        let template = exphbs.handlebars.compile(hbs);
        let factura = yield factura_1.getDataDetalleFacturaById(id_factura);
        if (factura.email_send == '1' && prioridad == false) {
            throw new Error(`la factura ${factura.id} ya fue notificada`);
        }
        //creamos la data que lleva la plantilla, o contendio dinamico
        data.factura = factura;
        data.fecha_actual = date_format_parse_1.format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
        data.urlService = `${process.env.BASE_URL.toString()}/page/DescargarReciboPago/${factura.id}`;
        yield new Promise((resolve, reject) => {
            qrcode_1.default.toDataURL(data.urlService, { errorCorrectionLevel: "L" }, (err, src) => {
                if (err) {
                    data.scrQR = '';
                }
                else {
                    data.scrQR = src;
                }
                resolve(true);
            });
        });
        //pasamos la data
        let resultHTML = template(data);
        //comvertimos la plantilla html a pdf
        let pdf = yield global_1.generarHTMLPDFNew(resultHTML);
        //enviamos el PDF al correo del cliente
        let resMail = yield mail_1.sendReciboPagoByID(factura.cliente, pdf, factura.categoria, factura.id);
        //si el correo se envia correctamente, actualizamos en base de datos
        if (resMail) {
            pago_provider_1.updateEmailSend(parseInt(id_factura));
        }
        return resMail;
    }
    catch (error) {
        console.log(error);
        return false;
    }
});
//# sourceMappingURL=template.js.map