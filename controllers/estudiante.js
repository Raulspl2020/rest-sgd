const { response } = require("express");
const { getPrograma } = require('../provider/estudiante_provider');
const estudianteProvider = require('../provider/estudiante_provider');

//====================
//   /estudiante/programas 
//=====================

const getProgramaEstudainte = async(req, res) => {
    let body = req.body;

    try {
        let row = await estudianteProvider.getPrograma(body.ide_estudiante);
        let programas = row[0];

        if (row[0].length > 0) {

            return res.status(200).json({
                error: false,
                date: programas,
            });

        } else {
            data = {
                message: "No se encontraron resultados",
                error: true,
            };
            res.status(400).json(data);
        }
    } catch (error) {
        res.json({
            error: true,
            message: error.message,
        });
    }
}


//====================
//   /estudiante/matriculas 
//=====================

const getMatriculaEstudainte = async(req, res) => {
    let body = req.body;

    try {
        let row = await estudianteProvider.getMatricula(body.ide_estudiante, body.ide_programa);
        let matriculas = row[0];



        if (row[0].length > 0) {

            return res.status(200).json({
                error: false,
                date: matriculas,
            });

        } else {
            data = {
                message: "No se encontraron resultados",
                error: true,
            };
            res.status(400).json(data);
        }
    } catch (error) {
        res.json({
            error: true,
            message: error.message,
        });
    }
}

module.exports = {
    getProgramaEstudainte,
    getMatriculaEstudainte
};