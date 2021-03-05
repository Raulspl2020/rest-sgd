import { response } from "express";
const cryptoRandomString = require('crypto-random-string');
import { Pago } from "../models/Pago";
import fetch from "node-fetch";

//====================
//   /transaccion/estado
//=====================
export const actualizarTransaccion = async (req: any, res = response) => {
  let body = req.body;

  res.status(200).json({
    message: "funciona la transaccion",
    codigo: cryptoRandomString({length: 10, characters: '1124862618DUVANROSERO'}),
    error: false,
  });
};

//====================
//   /transaccion/VerificacionPago
//=====================
export const verificaPago = async (req: any, res = response) => {

  let body = req.body;
  const data = {
    "int_id_comercio": process.env.ZONAPAGOS_ID,
    "str_usr_comercio": process.env.ZONAPAGOS_USER,
    "str_pwd_comercio": process.env.ZONAPAGOS_PASS,
    "int_no_pago": 1,
    "str_id_pago": body.str_id_pago
  };

  fetch(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.int_codigo == 1) {
        res.status(200).json({
          message: response.str_detalle,
          error: false,
          data: response,
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

  let infoPago: Pago = dataBody;

  let data: any = {
    InformacionSeguridad: {
      int_id_comercio: process.env.ZONAPAGOS_ID,
      str_usuario: process.env.ZONAPAGOS_USER,
      str_clave: process.env.ZONAPAGOS_PASS,
      int_modalidad: 1,
    },
    AdicionalesPago: [
      {
        int_codigo: 111,
        str_valor: "0",
      },
      {
        int_codigo: 112,
        str_valor: "0",
      },
    ],
    AdicionalesConfiguracion: [
      {
        int_codigo: 50,
        str_valor: "2701",
      },
      {
        int_codigo: 100,
        str_valor: "1",
      },
      {
        int_codigo: 101,
        str_valor: "1",
      },
      {
        int_codigo: 102,
        str_valor: "1",
      },
      {
        int_codigo: 103,
        str_valor: "0",
      },
      {
        int_codigo: 104,
        str_valor: "https://www.google.com.co/",
      },
      {
        int_codigo: 105,
        str_valor: "1",
      },
      {
        int_codigo: 106,
        str_valor: "3",
      },
      {
        int_codigo: 107,
        str_valor: "0",
      },
      {
        int_codigo: 108,
        str_valor: "1",
      },
      {
        int_codigo: 109,
        str_valor: "1",
      },
      {
        int_codigo: 110,
        str_valor: "0",
      },
    ],
  };

  data.InformacionPago = infoPago;

  fetch(process.env.ZONAPAGOS_URL + "/InicioPago", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.int_codigo == 1) {
        res.status(200).json({
          message: "Ejecucion correcta",
          error: false,
          data: response,
        });
      } else {
        res.status(500).json({
          message: "Parametos enviados de forma incorrecta",
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
