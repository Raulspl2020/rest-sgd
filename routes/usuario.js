const { Router } =  require('express');
const router = Router();

const { verificaToken } = require('../middlewares/autenticacion');
const md_usuario = require('../models/usuario_model');

router.post('/auditoria', verificaToken, (req, res) => {

    md_usuario.auditoria(req.usuario.ide_persona)
        .then(rows => {
            let json = {};
            if (rows.length) {

                json = {
                    data: rows,
                    rs: true,
                }
            } else {
                json = {
                    msj: "No se encontraron resultados",
                    rs: false
                }
            }

            res.json(json);
        });

    // res.json(req.usuario);
});

module.exports = router;