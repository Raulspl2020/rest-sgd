import fetch from "node-fetch";
import { getPagosOnlinePendientes, obtenerPagosPendientes } from "../provider/pago_provider";


// pendiente borrar los pagos que lleven mas de 7 dias iniciados y no tengan detalle_pago


export const verificaPagosPendientes = async () => {
    try {
        let result = await obtenerPagosPendientes(7, [29, 32]);

        if (result != false) {

            result.forEach((row: any) => {
                fetch(`${process.env.BASE_URL}/transaccion/estado?id_pago=${row.codigo}`)
                    .then(response => response.json())
                    .then((responseData) => {
                        console.log("Ejecutando tarea de verificacion");
                        return responseData;
                    });
            });

        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        return false;
    }




}
export const verificaPagosPendientesOnline = async () => {
    try {
        let result = await getPagosOnlinePendientes(7);
        if (result != false) {
            result.forEach((row: any) => {
                
                fetch(`${process.env.BASE_URL}/transaccion/estado?id_pago=${row.codigo}`)
                    .then(response => response.json())
                    .then((responseData) => {
                        console.log("Ejecutando tarea de verificacion");
                        return responseData;
                    });
            });

        } else {
            return null;
        }
    } catch (error) {
        console.log("Error de SONDA");
        console.log(error);
        return false;
    }



}