import { response } from "express";
import cryptoRandomString from "crypto-random-string";
import { Pago } from "../models/Pago";
import fetch from "node-fetch";
import { decodeResPago, dataConfigPago } from "../helpers/pago";

import {
  guardarPago,
  guardarPagoyDetalle,
  getConceptosPaquete,
  actualizarEstadoPago
} from "../provider/pago_provider";

//====================
//   /transaccion/estado
//=====================
export const actualizarTransaccion = async (req: any, res = response) => {

  

  let params  = req.query;
  let body = req.body;
  console.log("peticion de zonapagos entrante...");
  console.log(body);
  console.log("peticion de zonapagos entrante params");
  console.log(params);

  let updateData :any= {
    'json_update' : JSON.stringify(body),

  } 

  try {
    let result = await actualizarEstadoPago(updateData, "EREOA1JOR7");
    res.status(200).json({
      message: "Pago actualizado exitosamente",
      codigo: result,
      body: body,
      params: params,
      error: false
    });

  } catch (error) {
    res.status(500).json({
      message: "Servicio no disponible temporalmente",
      error: true,
      det_error: error
    });
  }







};

//====================
//   /transaccion/VerificacionPago
//=====================
export const verificaPago = async (req: any, res = response) => {
  let body = req.body;
  const data = {
    int_id_comercio: process.env.ZONAPAGOS_ID,
    str_usr_comercio: process.env.ZONAPAGOS_USER,
    str_pwd_comercio: process.env.ZONAPAGOS_PASS,
    int_no_pago: -1,
    str_id_pago: body.str_id_pago,
  };

  fetch(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.int_error == 0) {
        let pagoDecoded = decodeResPago(response.str_res_pago);
        res.status(200).json({
          message: response.str_detalle,
          error: false,
          data: pagoDecoded,
          data_server: response.str_res_pago,
        });
      } else {
        res.status(200).json({
          message: response.str_detalle,
          error: true,
          data: response,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Algo salio mal",
        error: true,
        det_error: error,
      });
    });
};

//====================
//   /transaccion/InicioPago
//=====================
export const inicioPago = async (req: any, res = response) => {
  let dataBody: any = req.body;

  let infoPago = new Pago({
    flt_total_con_iva: dataBody.flt_total_con_iva,
    flt_valor_iva: dataBody.flt_valor_iva,
    str_id_pago: dataBody.str_id_pago,
    str_descripcion_pago: dataBody.str_descripcion_pago,
    str_email: dataBody.str_email,
    str_id_cliente: dataBody.str_id_cliente,
    str_tipo_id: dataBody.str_tipo_id,
    str_nombre_cliente: dataBody.str_nombre_cliente,
    str_apellido_cliente: dataBody.str_apellido_cliente,
    str_telefono_cliente: dataBody.str_telefono_cliente,
    str_opcional1: dataBody.str_opcional1, //codigo paquete
    str_opcional2: dataBody.str_opcional2, //valor en letras
    str_opcional3: dataBody.str_opcional3, //matricula
    str_opcional4: dataBody.str_opcional4, //periodo
    str_opcional5: dataBody.str_opcional5,
  });

  //si no se envia el codigo se crea un nuevo pago
  if (dataBody.str_id_pago == "") {
    //generamos el codigo
    let cadena =
      dataBody.str_nombre_cliente +
      dataBody.str_apellido_cliente +
      dataBody.str_id_cliente.trim();
    let codigo = await cryptoRandomString({
      length: 10,
      characters: cadena.replace(/\s+/g, ""),
    });
    infoPago.str_id_pago = codigo;

    let response = await savePago(infoPago);
    res.status(response.statusCode).json(response);
  } else {
    let response = await updatePago(infoPago);
    res.status(response.statusCode).json(response);
  }
};

//====================
//   guardarEL pago generado
//=====================
const savePago = async (infoPago: any) => {
  console.log("ejecutamos la fucnion de save");

  //pendiente validar precios

  let ret: any = {};

  let paquete_id = infoPago.str_opcional1;
  let tDetallePago: any = [];

  try {


    let response = await fetch(process.env.ZONAPAGOS_URL + "/InicioPago", {
      method: "POST",
      body: JSON.stringify(dataConfigPago(infoPago)),
      headers: { "Content-Type": "application/json" },
    });

    let responseData = await response.json();

    if (responseData.int_codigo == 1) {


      let conceptos = await getConceptosPaquete(paquete_id);
      if (conceptos.length > 0) {
        conceptos.forEach((concepto: any) => {
          tDetallePago.push({
            pago_id: null,
            concepto_id: concepto._id,
            descuento: concepto.descuento,
            aumento: concepto.aumento,
            valor_unidad:
              concepto.categoria_id == 0
                ? infoPago.flt_total_con_iva
                : concepto.valor_unidad,
            cantidad: concepto.cantidad,
          });
        });
      } else {
        throw new Error("No se encontro el paquete...");
      }


      let tPago: any = {
        codigo: infoPago.str_id_pago,
        descripcion: infoPago.str_descripcion_pago,
        json_response: JSON.stringify(responseData),
        estado_id: 888,
        estudiante_id: infoPago.str_id_cliente,
        matricula_id: (infoPago.str_opcional3 == "") ? null : infoPago.str_opcional3,
        valor: infoPago.flt_total_con_iva,
        valor_letras: infoPago.str_opcional2,
        periodo_id: (infoPago.str_opcional4 == "") ? null : infoPago.str_opcional4,
        archivo_id: null,
        categoria_pago_id: conceptos[0].categoria_id,
      };

      //guardar el detalle de la factura
      let resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);

      if (resultSavePago != false) {
        ret = {
          statusCode: 200,
          message: "Ejecucion correcta",
          error: false,
          pago_id: resultSavePago,
          data: responseData,
        };

        return ret;
      } else {
        throw new Error("No se ha podido guardar el pago");
      }
    } else {
      throw new Error("Parámetros enviados de forma incorrecta");
    }
  } catch (error) {
    ret = {
      statusCode: 500,
      message: error.message,
      error: true,
      det_error: error,
    };
    return ret;
  }
};

const updatePago = async (infoPago: any) => {
  console.log("ejecutamos la fucnion de update");
  let ret: any = {
    message: "Listo para actualizar",
    error: false,
    statusCode: 200,
  };


  return ret;
};
