import { Router } from 'express';
const router = Router();

import { verificaToken } from '../middlewares/autenticacion';

//====================
//   /inicio
//=====================
router.get('/inicio', verificaToken, (req:any, res:any) => {
    res.json(req.usuario);
});

module.exports = router;