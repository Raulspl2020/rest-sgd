const { Router } =  require('express');
const router = Router();

const { verificaToken } = require('../middlewares/autenticacion');

router.get('/inicio', verificaToken, (req, res) => {
    res.json(req.usuario);
});

module.exports = router;