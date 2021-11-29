import { Router } from 'express';
import cors from 'cors';
const router = Router();
import { actualizarTransaccion, inicioPago,verificaPago,soporteDescuento } from '../controllers/transaccion';
import { check } from 'express-validator';
import { validarCampos, validatorCampos,validarIdPago,consultaFacturaMid,registrarPagoMid,reversarPagoMid,actualizarPago, pagoPersonalizadoMid, pagoVariosMid } from '../middlewares/validar-campos';
import { existePagoDB, getInfoPagoFactura, InicioPagoCodigoBarras } from '../controllers/pago';
import {consultaEstadoFactura, consultaFacturaService, detalleFacturaByID, notificarEmailFactura, registrarPagoService, reversarPagoService, uploadMR5 } from '../controllers/factura';
import { generarPagoCodigoBarras, generarPagoCodigoBarrasGeneral, inicioPagoGeneral, inicioPagoInscripcion, inicioPagoMatricula, inicioPagosVarios } from '../controllers/zonapagos';





const corsOptions = {
  origin: function (origin:any, callback:any) {
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
}




//router.put('/estado', verificaToken, cors(corsOptions), actualizarTransaccion);
router.put('/estado', [], actualizarTransaccion);
router.get('/estado', [actualizarPago],actualizarTransaccion);


router.post('/soportedescuento', soporteDescuento);

router.post('/InicioPago', [validatorCampos], inicioPago);
router.post('/VerificacionPago',[validarIdPago], verificaPago);


router.post('/InicioPagoCodigoBarras', InicioPagoCodigoBarras);

router.post('/Existepago', existePagoDB);

//RUTAS PARA LOS PAGOS REALIZADOS Y FACTURAS
router.get('/informacionpago/:cod_pago', getInfoPagoFactura);


//SERVICIOS QUE SON CONSUMIDOS POR EL BANCO EN EL PAGO CON CODIGO DE BARRAS
router.post('/consultaFactura',[consultaFacturaMid], consultaFacturaService);
router.post('/registrarPagos',[registrarPagoMid], registrarPagoService);
router.post('/reversarPagos',[reversarPagoMid], reversarPagoService);

//SERVICIO PARA CONSULTAR FACTURAS
router.post('/ConsultaEstadoFactura', consultaEstadoFactura);

//devuelve un json de la data creada
router.post('/DetalleFactura/:ref', detalleFacturaByID);
router.post('/cargapagosMR5', uploadMR5);

//envia un correo electronico con el recibo de pago de la factura
router.get('/notificacionfactura/:referencia',[], notificarEmailFactura);



//rutas de prueba para los servicios de pago corregigos
router.post('/InicioPagoMatricula', inicioPagoMatricula);
router.post('/InicioPagoInscripcion', inicioPagoInscripcion);
router.post('/InicioPagoGeneral',[pagoPersonalizadoMid], inicioPagoGeneral);
router.post('/InicioPagosVarios',[pagoVariosMid], inicioPagosVarios);
router.get('/GenerarPagoCodigoBarras/:codigo', generarPagoCodigoBarras);

export default router;