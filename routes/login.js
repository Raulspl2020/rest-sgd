const { Router } = require('express');
const router = Router();
const { correoRecuperacion, resetPass, auth, saveNewPass, googleView, googleAuth, renewToken, googleAuth2 } = require('../controllers/login');
const { login_model } = require('../models/login_model');

//====================
//   /login 
//=====================

router.post('/auth', auth);

router.get('/auth', googleView);

router.post('/googleauth', googleAuth);

router.get('/googleauth', googleAuth2);

router.post('/renewtoken', renewToken);

router.post('/recuperacion', correoRecuperacion);

router.get('/viewresetpass/:token', resetPass);

router.post('/savenewpass', saveNewPass);




module.exports = router;