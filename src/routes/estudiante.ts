import { Router } from 'express';
const router = Router();
import { getProgramaEstudainte, getMatriculaEstudainte, getMateriasPerdidasEst } from '../controllers/estudiante';

//====================
//   /estudiante 
//=====================


router.get('/programas', getProgramaEstudainte);
router.get('/matriculas', getMatriculaEstudainte);
router.get('/reporte', getMateriasPerdidasEst);



export default router;