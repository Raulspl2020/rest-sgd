import { Router } from 'express';
import { verifiDataContacMid } from '../middlewares/validar-campos';
import { changePassword, getAuditoriaUsuario,getDataCedula,getInfoBasicUser,getInfoBasicUsuario,getInfoUser,getUserContacto, updateContactUser, updateInfoUser, verifyTokenMail } from '../controllers/usuario';
const router = Router();

import { verificaToken } from '../middlewares/autenticacion';
import { validaChangePassword, validaupdateContactUser } from '../middlewares/usuario_middleware';


router.get('/auditoria/:ideUsuario', verificaToken, getAuditoriaUsuario);

//validar que solo sigedin pueda consultar este servicio
router.get('/contacto/:ideUsuario', getUserContacto);
router.get('/infobasica/:ideUsuario', getInfoBasicUser);
router.post('/updateinfouser',[verifiDataContacMid], updateInfoUser);
router.get('/verifytokenmail/:token', verifyTokenMail);

router.post('/contacto', [verificaToken,validaupdateContactUser],updateContactUser);

router.post('/changepassword',[verificaToken, validaChangePassword], changePassword);
router.get('/infobasica',[verificaToken], getInfoBasicUsuario);
router.post('/decodecedula', getDataCedula);




export default router;