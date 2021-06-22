import { Router } from 'express';
import { generarPagoCodigoBarras } from '../controllers/pago';
import { vistaHolaMundo, pagoPersonalizado, pagoMatricula, pagoInscripcion, viewConsultaPago, viewPDFPago, consultaEstadoPagoView } from '../controllers/template';
const router = Router();

router.get('/inicio', vistaHolaMundo);
router.get('/PagoPersonalizado', pagoPersonalizado);
router.get('/PagoMatricula/:id_matricula', pagoMatricula);
router.get('/PagoInscripcion/:id_matricula', pagoInscripcion);
router.get('/ConsultaEstadoPago/:codigo', viewConsultaPago);
router.get('/GenerarPagoCodigoBarras/:codigo', generarPagoCodigoBarras);
router.get('/ConsultaEstadoPago', consultaEstadoPagoView);

export default router;