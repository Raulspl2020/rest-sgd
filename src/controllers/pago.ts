
import { getInfoPago, getInfoFactura } from "../provider/pago_provider";

//====================
//   /pago/generarpagoinscripcion 
//=====================
export const getInfoPagoFactura = async (req: any, res: any) => {
    let body = req.body;
    let codigoPago = req.params.cod_pago.trim()
    try {
        let infopago = await getInfoPago(codigoPago);
        let infopagoFactuta = await getInfoFactura(codigoPago);
        return res.status(200).json({
            error: true,
            message: "info pago",
            infopago,
            infopagoFactuta
        });

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }


}