import { Router } from 'express';
import { verificaTokenDB } from '../middlewares/autenticacion';
import { getFacturasPagadas, registrarFacturasPagadaSys } from '../controllers/sysapolo/factura';

const router = Router();

router.get('/listar',[verificaTokenDB("sysapolo.factura.listar")], getFacturasPagadas);


router.post('/registrarfactura',[verificaTokenDB("sysapolo.factura.registrarfactura")], registrarFacturasPagadaSys);

export default router;