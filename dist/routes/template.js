"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const factura_1 = require("../controllers/sysapolo/factura");
const pago_1 = require("../controllers/pago");
const template_1 = require("../controllers/template");
const router = express_1.Router();
router.get('/inicio', template_1.vistaHolaMundo);
router.get('/pagosvarios', template_1.pagoPersonalizado);
router.get('/PagoMatricula/:id_matricula', template_1.pagoMatricula);
router.get('/PagoInscripcion/:id_matricula', template_1.pagoInscripcion);
router.get('/ConsultaEstadoPago/:codigo', template_1.viewConsultaPago);
router.get('/GenerarPagoCodigoBarras/:codigo', pago_1.generarPagoCodigoBarras);
router.get('/ConsultaEstadoPago', template_1.consultaEstadoPagoView);
router.get('/DetalleFactura/:ref', template_1.htmlFacturaView);
router.get('/DetalleFactura/:ref/:tipo', template_1.pdfFacturaView);
router.get('/admindescuento', template_1.htmlAdminDescuentoView);
router.get('/descargarplantilladesceunto', template_1.descargarPlantillaDesceunto);
router.get('/DescargarReciboPago/:ref', template_1.pdfReciboPago);
router.get('/PagoPersonalizado', template_1.pagosvariosView);
router.get('/actualizarcontacto/:id_user', template_1.userUpdateContactView);
//desarrollada solo para probar el guardado de datos en sysapolo, pendiente borrar
router.get('/verificadorsys/:referencia', factura_1.inicarPorceso);
router.get('/eliminadorsys/:referencia', factura_1.inicarPorcesoDel);
exports.default = router;
//# sourceMappingURL=template.js.map