import { response } from "express";
import * as estudianteProvider from '../provider/estudiante_provider';

//====================
//   /estudiante/programas 
//=====================

export const getProgramaEstudainte = async (req: any, res: any) => {
    let body = req.query;
    console.log(body);

    try {
        let row = await estudianteProvider.getPrograma(body.ide_estudiante);
        let programas = row[0];
        let data: any = {};

        if (row[0].length > 0) {

            return res.status(200).json({
                error: false,
                data: programas,
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

export const getMatriculaEstudainte = async (req: any, res: any) => {
    let body = req.query;
    console.log(body);
    try {
        let row = await estudianteProvider.getMatricula(body.ide_estudiante, body.ide_programa);
        let matriculas = row[0];
        let data: any = {};


        if (row[0].length > 0) {

            return res.status(200).json({
                error: false,
                data: matriculas,
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

