import { Router } from 'express';
const router = Router();
import { getProgramaEstudainte, getMatriculaEstudainte, getMateriasPerdidasEst, getInfoEstudiante, getProgramaEstudiante } from '../controllers/estudiante';

//====================
//   /estudiante 
//=====================


router.get('/programas', getProgramaEstudainte);
router.get('/matriculas', getMatriculaEstudainte);
router.get('/reporte', getMateriasPerdidasEst);
router.get('/detalle/:ide', getInfoEstudiante);
router.get('/programas/:id_estudiante', getProgramaEstudiante);



export default router;