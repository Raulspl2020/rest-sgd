import { Router } from 'express';
import { generarPagoCodigoBarras } from '../controllers/pago';
import { vistaHolaMundo, pagoPersonalizado, pagoMatricula, pagoInscripcion, viewConsultaPago, viewPDFPago, consultaEstadoPagoView, pdfFacturaView, htmlFacturaView, htmlAdminDescuentoView, descargarPlantillaDesceunto, pdfReciboPago } from '../controllers/template';
const router = Router();

router.get('/inicio', vistaHolaMundo);
router.get('/PagoPersonalizado', pagoPersonalizado);
router.get('/PagoMatricula/:id_matricula', pagoMatricula);
router.get('/PagoInscripcion/:id_matricula', pagoInscripcion);
router.get('/ConsultaEstadoPago/:codigo', viewConsultaPago);
router.get('/GenerarPagoCodigoBarras/:codigo', generarPagoCodigoBarras);
router.get('/ConsultaEstadoPago', consultaEstadoPagoView);
router.get('/DetalleFactura/:ref', htmlFacturaView);
router.get('/DetalleFactura/:ref/:tipo', pdfFacturaView);
router.get('/admindescuento', htmlAdminDescuentoView);
router.get('/descargarplantilladesceunto', descargarPlantillaDesceunto);
router.get('/DescargarReciboPago/:ref', pdfReciboPago);

export default router;