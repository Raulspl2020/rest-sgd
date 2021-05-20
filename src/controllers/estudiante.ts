import { response } from "express";
import * as estudianteProvider from '../provider/estudiante_provider';
import {getEstMatriculados, getMateriasEstudiante} from '../provider/estudiante_provider';

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




export const getMateriasPerdidasEst = async (req: any, res: any) => {


    try {
        
        
        let  resultDB:any = await getEstMatriculados();


        let cont = 0;
        for (const row of resultDB){
           
            let res:any =  await  getMateriasEstudiante(row.cod_periodo,row.id_programa_persona, row.NUM_DOCUMENTO);
            resultDB[cont].perdidas =  (res==false) ? 0 : res[0].perdidas;
            cont++;
       
           

        }

        // resultDB.asyncForEach([1, 2, 3], async (num) => {
        //     let res =  await  getMateriasEstudiante(row.cod_periodo,row.id_programa_persona, row.NUM_DOCUMENTO);
        //   });




        res.json(resultDB);
        
    } catch (error) {
        console.log(error);
        res.json({
            error: true,
            message: error.message,
  
        });
        
    }



}