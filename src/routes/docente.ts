import { Router } from 'express';
const router = Router();
import {getAsignaturasDocente } from '../controllers/docente';

//====================
//   /estudiante 
//=====================


router.get('/cargaacademica/:id_docente/:periodo', getAsignaturasDocente);




export default router;