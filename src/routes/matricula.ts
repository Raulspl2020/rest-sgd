import { Router } from 'express';
const router = Router();
import {generarpagoMatricula}  from '../controllers/matricula';

router.get('/generarpagomatricula/:id_matricula', generarpagoMatricula);



export default router;