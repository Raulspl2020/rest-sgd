import { Router } from 'express';
import { getAuditoriaUsuario,getInfoBasicUser,getInfoUser,getUserContacto } from '../controllers/usuario';
const router = Router();

import { verificaToken } from '../middlewares/autenticacion';


router.get('/auditoria/:ideUsuario', verificaToken, getAuditoriaUsuario);

//validar que solo sigedin pueda consultar este servicio
router.get('/contacto/:ideUsuario', getUserContacto);
router.get('/infobasica/:ideUsuario', getInfoBasicUser);

export default router;