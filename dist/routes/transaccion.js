"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
const transaccion_1 = require("../controllers/transaccion");
const validar_campos_1 = require("../middlewares/validar-campos");
const pago_1 = require("../controllers/pago");
const factura_1 = require("../controllers/factura");
const zonapagos_1 = require("../controllers/zonapagos");
const corsOptions = {
    origin: function (origin, callback) {
        const whitelist = ['http://127.0.0.1:55f00', 'http://example2.com'];
        //consulat en la base de datos
        // if (whitelist.indexOf(origin) !== -1) {
        //   callback(null, true)
        // } else {
        //   return res.status(300).json({
        //     error: false,
        //     data: "No permitida por CORS",
        // });
        //  // callback(new Error('Not allowed by CORS'));
        // }
    }
};
//router.put('/estado', verificaToken, cors(corsOptions), actualizarTransaccion);
router.put('/estado', [], transaccion_1.actualizarTransaccion);
router.get('/estado', [validar_campos_1.actualizarPago], transaccion_1.actualizarTransaccion);
router.post('/soportedescuento', transaccion_1.soporteDescuento);
router.post('/InicioPago', [validar_campos_1.validatorCampos], transaccion_1.inicioPago);
router.post('/VerificacionPago', [validar_campos_1.validarIdPago], transaccion_1.verificaPago);
router.post('/InicioPagoCodigoBarras', pago_1.InicioPagoCodigoBarras);
router.post('/Existepago', pago_1.existePagoDB);
//RUTAS PARA LOS PAGOS REALIZADOS Y FACTURAS
router.get('/informacionpago/:cod_pago', pago_1.getInfoPagoFactura);
//SERVICIOS QUE SON CONSUMIDOS POR EL BANCO EN EL PAGO CON CODIGO DE BARRAS
router.post('/consultaFactura', [validar_campos_1.consultaFacturaMid], factura_1.consultaFacturaService);
router.post('/registrarPagos', [validar_campos_1.registrarPagoMid], factura_1.registrarPagoService);
router.post('/reversarPagos', [validar_campos_1.reversarPagoMid], factura_1.reversarPagoService);
//SERVICIO PARA CONSULTAR FACTURAS
router.post('/ConsultaEstadoFactura', factura_1.consultaEstadoFactura);
//devuelve un json de la data creada
router.post('/DetalleFactura/:ref', factura_1.detalleFacturaByID);
router.post('/cargapagosMR5', factura_1.uploadMR5);
//envia un correo electronico con el recibo de pago de la factura
router.get('/notificacionfactura/:referencia', [], factura_1.notificarEmailFactura);
//elimina una factura por id si esta no tiene pagos exitosos o pendientes
router.delete('/eliminarfactura/:referencia', [], factura_1.eliminarFactura);
//rutas de prueba para los servicios de pago corregigos
router.post('/InicioPagoMatricula', zonapagos_1.inicioPagoMatricula);
router.post('/InicioPagoInscripcion', zonapagos_1.inicioPagoInscripcion);
router.post('/InicioPagoGeneral', [validar_campos_1.pagoPersonalizadoMid], zonapagos_1.inicioPagoGeneral);
router.post('/InicioPagosVarios', [validar_campos_1.pagoVariosMid], zonapagos_1.inicioPagosVarios);
router.get('/GenerarPagoCodigoBarras/:codigo', zonapagos_1.generarPagoCodigoBarras);
exports.default = router;
//# sourceMappingURL=transaccion.js.map