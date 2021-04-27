import { Router } from 'express';
import cors from 'cors';
const router = Router();
import { actualizarTransaccion, inicioPago,verificaPago,soporteDescuento } from '../controllers/transaccion';
import { check } from 'express-validator';
import { validarCampos, validatorCampos,validarIdPago } from '../middlewares/validar-campos';
import { getInfoPagoFactura } from '../controllers/pago';




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
router.put('/estado', actualizarTransaccion);
router.get('/estado', actualizarTransaccion);


router.post('/soportedescuento', soporteDescuento);

router.post('/InicioPago', [validatorCampos], inicioPago);
router.post('/VerificacionPago',[validarIdPago], verificaPago);


//RUTAS PARA LOS PAGOS REALIZADOS Y FACTURAS
router.get('/informacionpago/:cod_pago', getInfoPagoFactura);

export default router;