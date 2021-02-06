const { Router } = require('express');
const router = Router();
const cors = require('cors');
const { enviaEMail,consultaCorreo } = require('../controllers/mail');

const corsOptions = {
    origin: function (origin, callback) {
      const whitelist = ['http://127.0.0.1:55f00', 'http://example2.com'];
      
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  }

router.post('/enviacorreo', [], enviaEMail);

router.get('/consulta_correo/:ide_estudiante',consultaCorreo);

module.exports = router;