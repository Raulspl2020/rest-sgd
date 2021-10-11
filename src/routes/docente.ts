import { Router } from 'express';
const router = Router();
import { getAsignaturasDocente, getEstudiantesCarga, getHorarioDocente, getPeriodosDocente } from '../controllers/docente';

//====================
//   /estudiante 
//=====================


router.get('/cargaacademica/:id_docente/:periodo', getAsignaturasDocente);
router.get('/horario/:id_docente/:periodo', getHorarioDocente);
router.get('/listarestudiantes/:id_carga', getEstudiantesCarga);
router.get('/periodos/:id_docente', getPeriodosDocente);




export default router;