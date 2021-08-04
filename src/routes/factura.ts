import { Router } from 'express';
import { verificaTokenDB } from '../middlewares/autenticacion';
import { getFacturasPagadas } from '../controllers/sysapolo/factura';

const router = Router();

const cod_listar = "sysapolo.factura.listar";
router.get('/listar',[verificaTokenDB(cod_listar)], getFacturasPagadas);

export default router;