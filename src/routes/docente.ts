import { Router } from 'express';
import { validaGuardarSesionAsistencia } from '../middlewares/docente_middleware';
const router = Router();
import { eliminarSesionAsistencia, getAsignaturasDocente, getEstudiantesCarga, getHorarioDocente, getPeriodosDocente, guardarSesionAsistencia } from '../controllers/docente';
import { verificaToken } from '../middlewares/autenticacion';

//====================
//   /estudiante 
//=====================


router.get('/cargaacademica/:id_docente/:periodo', [verificaToken], getAsignaturasDocente);
router.get('/horario/:id_docente/:periodo',[verificaToken], getHorarioDocente);
router.get('/listarestudiantes/:id_carga', [verificaToken], getEstudiantesCarga);
router.get('/periodos/:id_docente', [verificaToken], getPeriodosDocente);

router.post('/sesion', [verificaToken,validaGuardarSesionAsistencia], guardarSesionAsistencia);
router.delete('/sesion/:id_sesion', [verificaToken], eliminarSesionAsistencia);






export default router;