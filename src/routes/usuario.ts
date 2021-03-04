import { Router } from 'express';
import { getAuditoriaUsuario } from '../controllers/usuario';
const router = Router();

import { verificaToken } from '../middlewares/autenticacion';


router.get('/auditoria/:ideUsuario', verificaToken, getAuditoriaUsuario);

export default router;