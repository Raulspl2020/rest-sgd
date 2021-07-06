import { Router } from 'express';
const router = Router();
import {cargaPlantillaDescuento, consultarPagoInscripcion, generarpagoMatricula}  from '../controllers/matricula';

router.get('/generarpagomatricula/:id_matricula', generarpagoMatricula);
router.get('/generarpagoinscripcion/:id_matricula', consultarPagoInscripcion);
router.post('/CargaPlantillaDescuento', cargaPlantillaDescuento);



export default router;