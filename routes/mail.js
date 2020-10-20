var nodemailer = require('nodemailer');
const { Router } = require('express');
const router = Router();
const { enviaEMail } = require('../controllers/mail');


router.post('/enviacorreo', [], enviaEMail);

module.exports = router;