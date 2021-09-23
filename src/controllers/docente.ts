import { format } from "date-format-parse";
import { getCargaAcademica, getHorarioAsigantura, obtenerEstudaintesCarga } from "../provider/docente_provider";

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