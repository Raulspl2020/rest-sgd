import { Router } from 'express';
const router = Router();
import { getAsignaturasDocente, getEstudiantesCarga, getPeriodosDocente } from '../controllers/docente';

//====================
//   /estudiante 
//=====================


router.get('/cargaacademica/:id_docente/:periodo', getAsignaturasDocente);
router.get('/listarestudiantes/:id_carga', getEstudiantesCarga);
router.get('/periodos/:id_docente', getPeriodosDocente);




export default router;