import { Router } from 'express';
const router = Router();
import { getProgramaEstudainte, getMatriculaEstudainte } from '../controllers/estudiante';

//====================
//   /estudiante 
//=====================


router.get('/programas', getProgramaEstudainte);
router.get('/matriculas', getMatriculaEstudainte);



export default router;