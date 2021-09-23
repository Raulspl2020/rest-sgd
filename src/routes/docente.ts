import { Router } from 'express';
const router = Router();
import { getAsignaturasDocente, getEstudiantesCarga } from '../controllers/docente';

//====================
//   /estudiante 
//=====================


router.get('/cargaacademica/:id_docente/:periodo', getAsignaturasDocente);
router.get('/listarestudiantes/:id_carga', getEstudiantesCarga);




export default router;