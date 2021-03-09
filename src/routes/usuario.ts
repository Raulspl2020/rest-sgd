import { Router } from 'express';
import { getAuditoriaUsuario,getUserContacto } from '../controllers/usuario';
const router = Router();

import { verificaToken } from '../middlewares/autenticacion';


router.get('/auditoria/:ideUsuario', verificaToken, getAuditoriaUsuario);

//validar que solo sigedin pueda consultar este servicio
router.get('/contacto/:ideUsuario', getUserContacto);

export default router;