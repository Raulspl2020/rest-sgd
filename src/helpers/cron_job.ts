import fetch from "node-fetch";
import {
  actualizarPagoyDetalleVeri,
  consultaPagosSINNPAGO,
  getPagosOnlinePendientes,
  obtenerPagosPendientes,
} from "../provider/pago_provider";
import { v4 as uuidv4 } from "uuid";
import { parse, format } from "date-format-parse";
import { consultaFacturasPagadas } from "../provider/factura_provider";
import { registroFacturaSysApolo } from "../controllers/sysapolo/factura";
import { decodePagoToList } from "./decodePagoToList";

// pendiente borrar los pagos que lleven mas de 7 dias iniciados y no tengan detalle_pago

export const verificaPagosPendientes = async () => {
  try {
    let result = await obtenerPagosPendientes(7, [29, 32]);

    if (result != false) {
      result.forEach((row: any) => {
        fetch(
          `${process.env.BASE_URL}/transaccion/estado?id_pago=${row.codigo}`
        )
          .then((response) => response.json())
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
};
export const verificaPagosPendientesOnline = async () => {
  let minutos = !process.env.TIEMPO_VERIFICACION_MIN
    ? 7
    : parseInt(process.env.TIEMPO_VERIFICACION_MIN.toString());
  try {
    let result = await getPagosOnlinePendientes(minutos);
    if (result != false) {
      result.forEach((row: any) => {
        console.log(`VERIFICANDO FACTURA: ${row.id_factura}`);

        fetch(
          `${process.env.BASE_URL}/transaccion/estado?id_pago=${row.id_factura}`
        )
          .then((response) => response.json())
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
};

// se usa para reconstruir todos los pagos
export const verificaPagosNpago = async () => {
  try {
    const resultDB = await consultaPagosSINNPAGO();

    console.log("Iniciamos la verificacion");
    for (const row of resultDB) {
      const data = {
        int_id_comercio: process.env.ZONAPAGOS_ID,
        str_usr_comercio: process.env.ZONAPAGOS_USER,
        str_pwd_comercio: process.env.ZONAPAGOS_PASS,
        int_no_pago: -1,
        str_id_pago: row.pago_id,
      };

      let response = await fetch(
        process.env.ZONAPAGOS_URL + "/VerificacionPago",
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        }
      );
      let responseData = await response.json();
      let detPago: any = [];
      //si encuentra los pagos
      if (responseData.int_error == 0 && responseData.int_cantidad_pagos > 0) {
        console.log("encontrado: " + row.pago_id);

        let pagoDecoded = decodePagoToList(responseData.str_res_pago);

        pagoDecoded.forEach((det: any) => {
          let fechaUpdate = new Date();
          let fechaInsert: any = new Date();
          if (det.dat_fecha == "") {
            fechaInsert = format(fechaUpdate, "YYYY-MM-DD HH:mm:ss");
          } else {
            fechaInsert = format(
              parse(det.dat_fecha, "DD/MM/YYYY h:mm:ss A"),
              "YYYY-MM-DD HH:mm:ss"
            );
          }

          detPago.push({
            _id: uuidv4(),
            pago_id: row.pago_id,
            int_n_pago: det.int_n_pago == "" ? null : det.int_n_pago,
            valor_pago: det.dbl_valor_pagado == "" ? 0 : det.dbl_valor_pagado,
            total_pago: det.dbl_total_pago == "" ? 0 : det.dbl_total_pago,
            valor_iva_pago:
              det.dbl_valor_iva_pagado == "" ? 0 : det.dbl_valor_iva_pagado,
            estado_pago_id:
              det.int_estado_pago == "" ? null : det.int_estado_pago,
            forma_pago_id:
              det.int_id_forma_pago == "" ? null : det.int_id_forma_pago,
            nombre_banco:
              det.str_nombre_banco == "" ? null : det.str_nombre_banco,
            codigo_transaccion:
              det.str_codigo_transacción == ""
                ? null
                : det.str_codigo_transacción,
            fecha: fechaInsert,
            ticketID: det.str_ticketID == "" ? null : det.str_ticketID,
            numero_tarjeta:
              det.int_numero_tarjeta == "" ? null : det.int_numero_tarjeta,
            franquicia: det.str_franquicia == "" ? null : det.str_franquicia,
            cod_aprobacion:
              det.int_cod_aprobacion == "" ? null : det.int_cod_aprobacion,
            num_recibido:
              det.int_num_recibido == "" ? null : det.int_num_recibido,
          });
        });

        let resDb2 = await actualizarPagoyDetalleVeri(row.pago_id, detPago);

        console.log("Respuesta de BD");
        console.log(resDb2);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

//obtener pagos pendientes por registrar en sysApolo
export const verificaPagosPendienteSysApolo = async () => {
  const facturasPagadas = await consultaFacturasPagadas();

  for (let factura of facturasPagadas) {
    const [ok, message] = await registroFacturaSysApolo(
      parseInt(factura.id_factura)
    );

    if (ok) {
      console.log(
        "factura " + factura.id_factura + " ha sido registrada en sysApolo"
      );
    } else {
      console.log(message);
    }
  }
};
