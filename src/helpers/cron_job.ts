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

let isVerificandoPagosOnline = false;

const getCronNumber = (value: any, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const verificaPagosPendientes = async () => {
  const startedAt = Date.now();
  console.log(`[perf] cron verificaPagosPendientes inicio`);
  try {
    const sqlStartedAt = Date.now();
    let result = await obtenerPagosPendientes(7, [29, 32]);
    console.log(`[perf] SQL obtenerPagosPendientes ${Date.now() - sqlStartedAt}ms`);

    if (result != false) {
      result.forEach((row: any) => {
        const fetchStartedAt = Date.now();
        fetch(
          `${process.env.BASE_URL}/transaccion/estado?id_pago=${row.codigo}`
        )
          .then((response) => response.json())
          .then((responseData) => {
            console.log(`[perf] HTTP cron.verificaPagosPendientes.estado ${Date.now() - fetchStartedAt}ms`);
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
  } finally {
    console.log(`[perf] cron verificaPagosPendientes fin ${Date.now() - startedAt}ms`);
  }
};
export const verificaPagosPendientesOnline = async () => {
  const startedAt = Date.now();
  if (isVerificandoPagosOnline) {
    console.log("[cron] verificaPagosPendientesOnline omitido: ya hay una ejecución activa");
    return null;
  }

  isVerificandoPagosOnline = true;
  console.log(`[perf] cron verificaPagosPendientesOnline inicio`);
  let minutos = !process.env.TIEMPO_VERIFICACION_MIN
    ? 7
    : parseInt(process.env.TIEMPO_VERIFICACION_MIN.toString());
  const limit = getCronNumber(process.env.CRON_PAGOS_ONLINE_LIMIT, 10);
  const timeoutMs = getCronNumber(process.env.CRON_PAGOS_ONLINE_TIMEOUT_MS, 10000);
  try {
    const sqlStartedAt = Date.now();
    let result = await getPagosOnlinePendientes(minutos, limit);
    console.log(`[perf] SQL getPagosOnlinePendientes ${Date.now() - sqlStartedAt}ms`);
    if (result == false) {
      console.log("[cron] pagos pendientes encontrados: 0");
      return null;
    }

    console.log(`[cron] pagos pendientes encontrados: ${result.length}`);
    let index = 0;
    for (const row of result) {
      index++;
      const idPago = row.id_factura;
      const paymentStartedAt = Date.now();
      console.log(`[cron] verificando pago ${index} de ${result.length} id_pago=${idPago}`);

      try {
        const fetchStartedAt = Date.now();
        const response = await fetch(
          `${process.env.BASE_URL}/transaccion/estado?id_pago=${idPago}`,
          { timeout: timeoutMs },
        );
        const elapsedMs = Date.now() - fetchStartedAt;
        console.log(`[perf] HTTP cron.verificaPagosPendientesOnline.estado ${elapsedMs}ms`);

        let responseData: any = null;
        try {
          responseData = await response.json();
        } catch (parseError) {
          responseData = { error: true, message: "Respuesta no JSON" };
        }

        if (!response.ok || responseData?.error) {
          console.log(
            `[cron] pago id_pago=${idPago} fail tiempo=${Date.now() - paymentStartedAt}ms status=${response.status} message=${responseData?.message || responseData?.data?.str_detalle || "sin detalle"}`,
          );
          continue;
        }

        console.log(`[cron] pago id_pago=${idPago} ok tiempo=${Date.now() - paymentStartedAt}ms`);
      } catch (error) {
        const timeoutMessage = error?.type === "request-timeout" || error?.code === "ETIMEDOUT"
          ? "timeout"
          : error?.message || "error desconocido";
        console.log(`[cron] pago id_pago=${idPago} fail tiempo=${Date.now() - paymentStartedAt}ms error=${timeoutMessage}`);
      }
    }
  } catch (error) {
    console.log("Error de SONDA");
    console.log(error);
    return false;
  } finally {
    isVerificandoPagosOnline = false;
    console.log(`[cron] total verificaPagosPendientesOnline ${Date.now() - startedAt}ms`);
    console.log(`[perf] cron verificaPagosPendientesOnline fin ${Date.now() - startedAt}ms`);
  }
};

// se usa para reconstruir todos los pagos
export const verificaPagosNpago = async () => {
  const startedAt = Date.now();
  console.log(`[perf] cron verificaPagosNpago inicio`);
  try {
    const sqlStartedAt = Date.now();
    const resultDB = await consultaPagosSINNPAGO();
    console.log(`[perf] SQL consultaPagosSINNPAGO ${Date.now() - sqlStartedAt}ms`);

    console.log("Iniciamos la verificacion");
    for (const row of resultDB) {
      const data = {
        int_id_comercio: process.env.ZONAPAGOS_ID,
        str_usr_comercio: process.env.ZONAPAGOS_USER,
        str_pwd_comercio: process.env.ZONAPAGOS_PASS,
        int_no_pago: -1,
        str_id_pago: row.pago_id,
      };

      const fetchStartedAt = Date.now();
      let response = await fetch(
        process.env.ZONAPAGOS_URL + "/VerificacionPago",
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(`[perf] HTTP ZonaPagos.VerificacionPago.response ${Date.now() - fetchStartedAt}ms`);
      const jsonStartedAt = Date.now();
      let responseData = await response.json();
      console.log(`[perf] HTTP ZonaPagos.VerificacionPago.json ${Date.now() - jsonStartedAt}ms`);
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

        const updateStartedAt = Date.now();
        let resDb2 = await actualizarPagoyDetalleVeri(row.pago_id, detPago);
        console.log(`[perf] SQL actualizarPagoyDetalleVeri ${Date.now() - updateStartedAt}ms`);

        console.log("Respuesta de BD");
        console.log(resDb2);
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    console.log(`[perf] cron verificaPagosNpago fin ${Date.now() - startedAt}ms`);
  }
};

//obtener pagos pendientes por registrar en sysApolo
export const verificaPagosPendienteSysApolo = async () => {
  const startedAt = Date.now();
  console.log(`[perf] cron verificaPagosPendienteSysApolo inicio`);
  const sqlStartedAt = Date.now();
  const facturasPagadas = await consultaFacturasPagadas();
  console.log(`[perf] SQL consultaFacturasPagadas ${Date.now() - sqlStartedAt}ms`);

  for (let factura of facturasPagadas) {
    const facturaStartedAt = Date.now();
    const [ok, message] = await registroFacturaSysApolo(
      parseInt(factura.id_factura)
    );
    console.log(`[perf] registroFacturaSysApolo ${Date.now() - facturaStartedAt}ms`);

    if (ok) {
      console.log(
        "factura " + factura.id_factura + " ha sido registrada en sysApolo"
      );
    } else {
      console.log(message);
    }
  }
  console.log(`[perf] cron verificaPagosPendienteSysApolo fin ${Date.now() - startedAt}ms`);
};
