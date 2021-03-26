import { Router } from 'express';
import { vistaHolaMundo, pagoPersonalizado, pagoMatricula } from '../controllers/template';
const router = Router();

router.get('/inicio', vistaHolaMundo);
router.get('/PagoPersonalizado', pagoPersonalizado);
router.get('/PagoMatricula/:id_matricula', pagoMatricula);

export default router;