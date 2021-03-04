import  { Router } from 'express';
const router = Router();
import  { correoRecuperacion, resetPass, auth, saveNewPass, googleView, googleAuth, renewToken } from '../controllers/login';


//====================
//   /login 
//=====================

router.post('/auth', auth);

router.get('/auth', googleView);

router.post('/googleauth', googleAuth);

router.post('/renewtoken', renewToken);

router.post('/recuperacion', correoRecuperacion);

router.get('/viewresetpass/:token', resetPass);

router.post('/savenewpass', saveNewPass);




export default router;