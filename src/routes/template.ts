import { Router } from 'express';
import { vistaHolaMundo, pagoPersonalizado } from '../controllers/template';
const router = Router();

router.get('/inicio', vistaHolaMundo);
router.get('/PagoPersonalizado', pagoPersonalizado);

export default router;