import { format } from "date-format-parse";
import { Asistencia } from "../interfaces/docente.interface";
import { Usuario } from "../models/Usuario";
import { crearSesionAsistencia, delSesionAsistencia, getCargaAcademica, getHorarioAsigantura, getHorarioSemana, guardarAsistenciaByCarga, listarSesionesByCarga, obetnerFaltasBySesion, obtenerEstudaintesCarga, obtenerPeriodosDocente } from "../provider/docente_provider";

//====================
//   /docente/cargaacademica 
//=====================

export const getAsignaturasDocente = async (req: any, res: any) => {
    const usuario: Usuario = req.usuario;

    let id_docente: string = usuario.id;
    let periodo: string = req.params.periodo;

    interface Horaio {
        dia: string,
        horas: any[]
    }

    try {

        const cargaDB = await getCargaAcademica(id_docente.trim(), periodo.trim());

        for (let row of cargaDB) {

            const horarioDB = await getHorarioAsigantura(row.cod_colegio_asignatura_docente);

            //obtenemos los dias
            let dias: string[] = [];
            for (const horario of horarioDB) {
                dias.push(horario.desc_dia);
            }
            const diaUniqueArray = [...new Set(dias)];

            let diasInter: Horaio[] = [];

            for (let d of diaUniqueArray) {

                let dia: Horaio = {
                    dia: "",
                    horas: []
                };

                dia.dia = d;

                for (const horario of horarioDB) {
                    if (d == horario.desc_dia) {
                        dia.horas.push(horario);
                    }
                }
                diasInter.push(dia);

            }




            row.horario = diasInter;
        }

        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            data: cargaDB
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }

}


//====================
//   /docente/horario 
//=====================

export const getHorarioDocente = async (req: any, res: any) => {
    const usuario: Usuario = req.usuario;

    let id_docente: string = usuario.id;
    let periodo: string = req.params.periodo;

    interface Dia {
        nom_dia: string,
        cod_dia: number,
        abrev_dia: string
        horas?: any

    }

    interface Hora {

        desc_hora?: string,
        hora_inicial: number,
        hora_final: string
        abrev_hora?: any,
        dias?: any
    }

    try {
        const cargaDB = await getHorarioSemana(id_docente.trim(), periodo.trim());

        let dias: Dia[] = [];
        let horas: Hora[] = [];

        //obtenemos los dias
        for (let row of cargaDB) {
            let encontrado = false;

            for (const dia of dias) {
                if (row.dia == dia.nom_dia) {
                    encontrado = true;
                }
            }
            if (!encontrado) {
                const d: Dia = {
                    nom_dia: row.dia,
                    cod_dia: row.cod_dia,
                    abrev_dia: row.abre_dia,
                }
                dias.push(d);
            }

        }

        //obtener las horas
        for (let row of cargaDB) {
            let encontrado = false;

            for (const hora of horas) {
                if ((row.hora_inicial === hora.hora_inicial) && (row.hora_final === hora.hora_final)) {
                    encontrado = true;
                }
            }
            if (!encontrado) {

                //llenamos a cada dia las horas

                let arrayHoras: any[] = [];

                for (let row2 of cargaDB) {
                    if ((row2.hora_inicial == row.hora_inicial) && (row2.hora_final == row.hora_final)) {
                        arrayHoras.push(row2);
                    }
                }

                const h: Hora = {
                    abrev_hora: row.abrev_hora,
                    hora_inicial: row.hora_inicial,
                    hora_final: row.hora_final,
                    desc_hora: row.desc_hora,
                    dias: arrayHoras
                }
                horas.push(h);
            }
        }

        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            dias,
            horas
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }

}



//====================
//  POST /docente/sesion 
//=====================
export const guardarSesionAsistencia = async (req: any, res: any) => {

    let body = req.body;
    const usuario: Usuario = req.usuario;

    try {

        const data = {
            id_syllabussesion: (body.id_syllabussesion==null || body.id_syllabussesion=='' ) ? null : body.id_syllabussesion,
            cod_colegio_asignatura_docente: body.cod_colegio_asignatura_docente,
            descripcion: body.descripcion,
            titulo: body.titulo,
            persona_id: usuario.id,
            nro_horas: body.nro_horas,
            clasificacion: body.clasificacion,
            subperiodo_id: body.subperiodo_id,
            examen_parcial: body.examen_parcial
        }

        let estCargaDB = await crearSesionAsistencia(data);


        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            data: estCargaDB,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }


}


//====================
//  DELETE /docente/sesion 
//=====================
export const eliminarSesionAsistencia = async (req: any, res: any) => {

    let id_syllabussesion: string = req.params.id_sesion;
    const usuario: Usuario = req.usuario;

    try {

        const data = {
            id_syllabussesion : id_syllabussesion ,
            persona_id : usuario.id
        }

        let resCargaDB = await delSesionAsistencia(data);

        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            data: resCargaDB,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }


}
//====================
//  GET /docente/sesiones 
//=====================
export const listarSesionesPorCarga = async (req: any, res: any) => {

    let id_carga: number = parseInt(req.params.id_carga);
    const usuario: Usuario = req.usuario;

    try {

        let resCargaDB = await listarSesionesByCarga(id_carga,usuario.id);

        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            data: resCargaDB,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }


}







export const getEstudiantesCarga = async (req: any, res: any) => {
    const usuario: Usuario = req.usuario;
    try {

        let id_carga: number = parseInt(req.params.id_carga);

        let estCargaDB = await obtenerEstudaintesCarga(id_carga);

        for (let row of estCargaDB) {
            row.fecha_registro = format(row.fecha_registro, 'DD-MM-YYYY hh:mm:ss A');
        }

        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            data: estCargaDB
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }


}




export const getEstudiantesSesion = async (req: any, res: any) => {
    const usuario: Usuario = req.usuario;
    try {

        let id_carga: number = parseInt(req.params.id_carga);
        let id_sesion: number = parseInt(req.params.id_sesion);

        let estCargaDB = await obtenerEstudaintesCarga(id_carga);
        let asistenciaCargaDB = await obetnerFaltasBySesion(id_sesion);


        for (let row of estCargaDB) {
            row.fecha_registro = format(row.fecha_registro, 'DD-MM-YYYY hh:mm:ss A');
            row.asistencia =  null;

            for(const asistencia of asistenciaCargaDB){

                if(row.ide_persona == asistencia.persona_id){
                    row.asistencia =  asistencia;
                }

            }


        }

        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            data: estCargaDB
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }


}




export const getPeriodosDocente = async (req: any, res: any) => {
    const usuario: Usuario = req.usuario;
    try {

        let id_docente: string = req.params.id_docente;

        let periodosDocDB = await obtenerPeriodosDocente(usuario.id);
        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            data: periodosDocDB
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Algo salio mal",
            data: [],
            error: true,
            det_error: error,
        });
    }


}



//====================
//  GET /docente/asistencia 
//=====================

//permite reistrar las faltas a cada estudiante perteneciente a una carga academica

export const registroAsistencia = async (req: any, res: any) => {
    const usuario: Usuario = req.usuario;
    const asistencias: Asistencia[] = req.body;

    try {

        const respDB = await guardarAsistenciaByCarga(asistencias);
        
        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            data: asistencias,
            respDB
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Algo salio mal",
            data: [],
            error: true,
            det_error: error,
        });
    }


}