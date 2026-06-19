import { getConceptosByConfigActive } from "../provider/factura_provider";

//====================
//   /factura/obtenerconceptos
//=====================
export const getConceptos = async (req: any, res: any) => {
    const nodeEnv = String(process.env.NODE_ENV || "").toLowerCase();
    const profile = req.query?.profile === "1" && nodeEnv !== "pro" && nodeEnv !== "production";
    const startedAt = Date.now();

    try {

        let resultDB = await getConceptosByConfigActive();
        if (profile) {
            console.log(`[profile:factura/obtenerconceptos] getConceptosByConfigActive: ${Date.now() - startedAt}ms`);
        }

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
