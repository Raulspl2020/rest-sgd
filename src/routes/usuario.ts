import { Router } from 'express';
import { verifiDataContacMid } from '../middlewares/validar-campos';
import { getAuditoriaUsuario,getInfoBasicUser,getInfoUser,getUserContacto, updateInfoUser, verifyTokenMail } from '../controllers/usuario';
const router = Router();

import { verificaToken } from '../middlewares/autenticacion';


router.get('/auditoria/:ideUsuario', verificaToken, getAuditoriaUsuario);

//validar que solo sigedin pueda consultar este servicio
router.get('/contacto/:ideUsuario', getUserContacto);
router.get('/infobasica/:ideUsuario', getInfoBasicUser);
router.post('/updateinfouser',[verifiDataContacMid], updateInfoUser);
router.get('/verifytokenmail/:token', verifyTokenMail);

export default router;