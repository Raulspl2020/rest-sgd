import { getInfoMatricula, getDetPeriodo } from "../provider/matricula_provider";
import { getConfigPeriodo, getPaquete } from "../provider/pago_provider";

//====================
//   /matricula/generarpagomatricula 
//=====================
export const generarpagoMatricula = async (req: any, res: any) => {
    let token = req.body.token;
    let resultDB;
    let total =0;
    let total_a_pagar=0;
    let precios;
    let periodo;
    let id_matricula = req.params.id_matricula.trim();
    try {
        let result = await getInfoMatricula(id_matricula);
        if (result[0].length > 0) {
            resultDB = result[0][0];

            let resultConfig = await getConfigPeriodo(resultDB.cod_periodo);

            //configurar deacuerdo a la configuracion del periodo
            if (resultDB.nro_creditos <= resultConfig.min_creditos) {
                //se debe cobrar por credito individual
                console.log("Se cobra por creditos");
                let result = await getPaquete(resultDB.cod_periodo, 1);
                 periodo = await getDetPeriodo(resultDB.cod_colegio,resultDB.cod_periodo);
                if (result[0].length > 0) {
                    precios = result[0];
                    precios.forEach((element:any) => {
                    total = element.subtotal + total;
                    });
                    total_a_pagar = total * resultDB.nro_creditos;

                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            } else {
                //se cobra el valor total de la matricula
                console.log("Se cobra matricula completa");


                

            }


            return res.json({
                error: false,
                message: "Funcionando matricula",
                matricula: resultDB,
                total: total_a_pagar,
                periodo
            });

        } else {
            throw new Error("No se encontro la matricula");
        }


    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }



}