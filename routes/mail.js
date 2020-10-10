var nodemailer = require('nodemailer');
const { Router } = require('express');
const router = Router();
const { enviaEMail } = require('../controllers/mail');


router.post('/mail', [], enviaEMail);

module.exports = router;