import { Router } from 'express';
import { vistaHolaMundo } from '../controllers/template';
const router = Router();

router.get('/inicio', vistaHolaMundo);

export default router;