const { Router } = require('express');
const router = Router();
const { getProgramaEstudainte, getMatriculaEstudainte } = require('../controllers/estudiante');

//====================
//   /estudiante 
//=====================


router.get('/programas', getProgramaEstudainte);
router.get('/matriculas', getMatriculaEstudainte);



module.exports = router;