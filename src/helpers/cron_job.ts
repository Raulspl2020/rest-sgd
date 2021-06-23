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

    let minutos = (process.env.TIEMPO_VERIFICACION_MIN==undefined) ? 7 : parseInt(process.env.TIEMPO_VERIFICACION_MIN.toString());
    try {
        let result = await getPagosOnlinePendientes(minutos);
        if (result != false) {
            result.forEach((row: any) => {
                if(row.estado_pago_id ==999 || row.estado_pago_id ==4001 || row.estado_pago_id ==null || row.estado_pago_id ==200 || row.estado_pago_id==888  ){
                    fetch(`${process.env.BASE_URL}/transaccion/estado?id_pago=${row.codigo}`)
                    .then(response => response.json())
                    .then((responseData) => {
                        console.log("Ejecutando tarea de verificacion");
                        return responseData;
                    });

                }else{
                    console.log(`el pago con id:${row.id_pago}(${row.id_factura}) no cumple las condiciones para verificar`);
                }
                

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