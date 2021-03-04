import { Router } from 'express';
const router = Router();
const cors = require('cors');
import * as mailController  from '../controllers/mail';


// const corsOptions = {
//     origin: function (origin:any, callback:any) {
//       const whitelist = ['http://127.0.0.1:55f00', 'http://example2.com'];
      
//       if (whitelist.indexOf(origin) !== -1) {
//         callback(null, true)
//       } else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     }
//   }

router.post('/enviacorreo', mailController.enviaEMail);

router.get('/consulta_correo/:ide_estudiante',mailController.consultaCorreo);

export default router;