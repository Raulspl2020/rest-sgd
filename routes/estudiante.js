const { Router } =  require('express');
const router = Router();

const { verificaToken } = require('../middlewares/autenticacion');
const md_estudiante = require('../models/estudiante_model')

router.post('/programa_academico', verificaToken, async(req, res) => {

    let rows = await md_estudiante.getProgramaAcademico(req.usuario.ide_persona);

    let data = {};
    if (rows[0].length) {
        data = {
            data: rows[0],
            rs: true
        }
    } else {
        data = {
            msj: "No se encontraron resultados",
            rs: false
        }
    }

    res.json(data);

});



router.post('/semestre', verificaToken, async(req, res) => {
    let body = req.body;

    let rows = await md_estudiante.getSemeste(req.usuario.ide_persona, body.id_programa_persona);
    let data = {};
    if (rows[0].length) {
        data = {
            data: rows[0],
            rs: true
        }
    } else {
        data = {
            msj: "No se encontraron resultados",
            rs: false
        }
    }

    res.json(data);

});


router.post('/boletin', verificaToken, async(req, res) => {
    let body = req.body;

    let rows = await md_estudiante.getBoletin(req.usuario.ide_persona, body.cod_matricula);
    let data = {};
    if (rows[0].length) {
        data = {
            data: rows[0],
            rs: true
        }
    } else {
        data = {
            msj: "No se encontraron resultados",
            rs: false
        }
    }

    res.json(data);

});



router.post('/horario_general', verificaToken, async(req, res) => {
    let body = req.body;

    let rows = await md_estudiante.getHorarioGeneral(body);
    let data = {};
    if (rows[0].length) {
        data = {
            data: rows[0],
            rs: true
        }
    } else {
        data = {
            msj: "No se encontraron resultados",
            rs: false
        }
    }

    res.json(data);

});

router.post('/mi_horario', verificaToken, async(req, res) => {
    let body = req.body;

    let rows = await md_estudiante.getMiHorario(req.usuario.ide_persona, body);
    let data = {};
    if (rows[0].length) {
        data = {
            data: rows[0],
            rs: true
        }
    } else {
        data = {
            msj: "No se encontraron resultados",
            rs: false
        }
    }

    res.json(data);

});




module.exports = router;