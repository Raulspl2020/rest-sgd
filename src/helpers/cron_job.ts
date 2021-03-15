import fetch from "node-fetch";
import { obtenerPagosPendientes } from "../provider/pago_provider";


export const verificaPagosPendientes = async () => {
    try {
        let result = await obtenerPagosPendientes(7, [29, 32]);

        if (result[0].length > 0) {
            let responseZona = await fetch(`${process.env.BASE_URL}/transaccion/estado?id_pago=${result[0][0].codigo}`);
            let responseData = await responseZona.json();
            console.log("Ejecutando tarea de verificacion");
            return responseData;
        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        return false;
    }



}
export const verificaPagosPendientesEfectivo = async () => {
    try {
        let result = await obtenerPagosPendientes(60, [41, 42]);

        if (result[0].length > 0) {
            let responseZona = await fetch(`${process.env.BASE_URL}/transaccion/estado?id_pago=${result[0][0].codigo}`);
            let responseData = await responseZona.json();
            console.log("Ejecutando tarea de verificacion");
            return responseData;
        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        return false;
    }



}