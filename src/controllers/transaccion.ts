import { response } from "express";
import cryptoRandomString from "crypto-random-string";
import { Pago } from "../models/Pago";
import fetch from "node-fetch";
import { decodeResPago,dataConfigPago } from "../helpers/pago";
import { guardarPago } from "../provider/pago_provider";

//====================
//   /transaccion/estado
//=====================
export const actualizarTransaccion = async (req: any, res = response) => {
  let body = req.body;

  res.status(200).json({
    message: "funciona la transaccion",
    codigo: cryptoRandomString({
      length: 10,
      characters: "1124862618DUVANROSERO",
    }),
    error: false,
  });
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
    dataBody.str_id_pago = codigo;
  }

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
    str_opcional1: dataBody.str_opcional1, //tipo de pago: matricula,inscripcion, otro
    str_opcional2: dataBody.str_opcional2, //valor en letras
    str_opcional3: dataBody.str_opcional3,
    str_opcional4: dataBody.str_opcional4,
    str_opcional5: dataBody.str_opcional5,
  });

  
  try {

    let response =  await  fetch(process.env.ZONAPAGOS_URL + "/InicioPago", {
      method: "POST",
      body: JSON.stringify(dataConfigPago(infoPago)),
      headers: { "Content-Type": "application/json" },
    });
    let responseData =  await response.json();

    if (responseData.int_codigo == 1) {
      let insert: any = {
        codigo: infoPago.str_id_pago,
        descripcion: infoPago.str_descripcion_pago,
        json_response: JSON.stringify(responseData),
        estado_id: 888,
        estudiante_id: infoPago.str_id_cliente,
        matricula_id: null,
        valor: infoPago.flt_total_con_iva,
        valor_letras: infoPago.str_opcional2,
        periodo_id: null,
        archivo_id: null,
        tipo_pago_id: infoPago.str_opcional1,
      };

      let resultSavePago = await guardarPago(insert);
      
      res.status(200).json({
        message: "Ejecucion correcta",
        error: false,
        data: responseData
        
      });

    } else {
      res.status(500).json({
        message: "Parametos enviados de forma incorrecta",
        error: true,
        data: response
      });
    }
    
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal",
      error: true,
      det_error: error,
    });
  }
  

};
