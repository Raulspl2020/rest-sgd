const { Router } = require('express');
const cors = require('cors')
const router = Router();
const { actualizarTransaccion } = require('../controllers/transaccion.js');
const { verificaToken } = require('../middlewares/autenticacion');




const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = ['http://127.0.0.1:55f00', 'http://example2.com'];

    //consulat en la base de datos

    
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}




router.put('/estado', verificaToken, cors(corsOptions), actualizarTransaccion);

module.exports = router;