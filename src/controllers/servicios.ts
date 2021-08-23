import { getConceptosByConfigActive } from "../provider/factura_provider";

//====================
//   /factura/obtenerconceptos
//=====================
export const getConceptos = async (req: any, res: any) => {

    try {

        let resultDB = await getConceptosByConfigActive();

        res.status(200).json({
            message: "Ejecución correcta",
            error: false,
            data: resultDB
        });

    } catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error.message,
        });
    }

}