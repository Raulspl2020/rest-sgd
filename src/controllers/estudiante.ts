import { format } from "date-format-parse";
import { response } from "express";
import * as estudianteProvider from '../provider/estudiante_provider';
import { getEstMatriculados, getMateriasEstudiante, getInfoEstudianteProv } from '../provider/estudiante_provider';

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


        let resultDB: any = await getEstMatriculados();


        let cont = 0;
        for (const row of resultDB) {

            let res: any = await getMateriasEstudiante(row.cod_periodo, row.id_programa_persona, row.NUM_DOCUMENTO);
            resultDB[cont].perdidas = (res == false) ? 0 : res[0].perdidas;
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



export const getInfoEstudiante = async (req: any, res: any) => {
    let ide_estuduante = req.params.ide;
    let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log(fullUrl);
    console.log(req.originalUrl);

    let estudiante: any = {};
    let programas: any = [];
    let matriculas: any = [];
    let programasArray: any = [];
    let prooo: any = [];
    try {

        let resultDB: any = await getInfoEstudianteProv(ide_estuduante);

        if (resultDB == false) {
            throw new Error("No se encontró el estudiante");
        }

        for (const row of resultDB) {
            estudiante.ide_persona = row.ide_persona;
            estudiante.tipo_documento = row.tipo_documento;
            estudiante.fec_expedicion_doc = format(row.fec_expedicion_doc, 'DD-MM-YYYY');   ;
            estudiante.ape1_persona = row.ape1_persona;
            estudiante.ape2_persona = row.ape2_persona;
            estudiante.nom1_persona = row.nom1_persona;
            estudiante.nom2_persona = row.nom2_persona;
            estudiante.fech_nac_persona = format( row.fech_nac_persona, 'DD-MM-YYYY');
            estudiante.munucipio_expedicion = row.munucipio_expedicion;
            estudiante.nom_genero = row.nom_genero;
            estudiante.dir_persona = row.dir_persona;
            estudiante.tel_persona = row.tel_persona;
            estudiante.cel_persona = row.cel_persona;
            estudiante.email_persona = row.email_persona;
            estudiante.email_institucion = row.email_institucion;

            if (!programas.includes(row.programa)) {
                programas.push(row.programa);
            }
        }

        for (const programa of programas) {
            for (const row of resultDB) {
                if (programa == row.programa) {

                    let encontrado = false;

                    for (const aux of prooo) {

                        if (aux.nom_programa == programa) {
                            encontrado = true;
                        }

                    }
                    if (!encontrado) {

                        prooo.push({
                            nom_programa: programa,
                            estado: row.nom_estadoinscripcion,
                            cod_snies: row.cod_snies
                        });
                    }
                }
            }
        }

        let programaUnico: any = [];



        for (const programa of prooo) {

            let mat: any = [];
            for (const row of resultDB) {

                if (programa.nom_programa == row.programa) {
                    mat.push({
                        cod_matricula: row.cod_matricula,
                        sede: row.sede,
                        periodo: row.periodo,
                        semestre: row.semestre,
                        estado: row.nom_estadomatricula,
                        fecha_matricula : format(row.fecha_matricula, 'DD-MM-YYYY')
                    });
                }
            }

            programa.matriculas = mat;
            programasArray.push(programa);

        }


        estudiante.programas = programasArray;
        res.json(estudiante);

    } catch (error) {
        console.log(error);
        res.json({
            error: true,
            message: error.message,

        });

    }



}
