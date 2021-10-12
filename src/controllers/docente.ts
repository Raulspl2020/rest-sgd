import { format } from "date-format-parse";
import { getCargaAcademica, getHorarioAsigantura, getHorarioSemana, obtenerEstudaintesCarga, obtenerPeriodosDocente } from "../provider/docente_provider";

//====================
//   /docente/cargaacademica 
//=====================

export const getAsignaturasDocente = async (req: any, res: any) => {

    let id_docente: string = req.params.id_docente;
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

    let id_docente: string = req.params.id_docente;
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



export const getEstudiantesCarga = async (req: any, res: any) => {
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




export const getPeriodosDocente = async (req: any, res: any) => {
    try {

        let id_docente: string = req.params.id_docente;

        let periodosDocDB = await obtenerPeriodosDocente(id_docente);
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

