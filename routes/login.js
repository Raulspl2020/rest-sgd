const { Router } = require('express');
const router = Router();
const { correoRecuperacion,resetPass,login, saveNewPass,googleView,googleAuth } = require('../controllers/login');
const {login_model} = require('../models/login_model');


router.post('/login', login);

router.get('/googleview', googleView);

router.post('/googleauth', googleAuth);

router.post('/recuperacion', correoRecuperacion);

router.get('/viewresetpass/:token', resetPass);

router.post('/savenewpass',saveNewPass );




module.exports = router;