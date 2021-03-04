import { response } from "express";
import { validationResult } from "express-validator";
import { Pago } from "../models/Pago";
import fetch from "node-fetch";

//====================
//   /transaccion/estado
//=====================
export const actualizarTransaccion = async (req: any, res = response) => {
  let body = req.body;

  res.status(200).json({
    message: "funciona la transaccion",
    error: false,
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

  console.log(process.env.ZONAPAGOS_URL);
  fetch(process.env.ZONAPAGOS_URL + "/InicioPago", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((response) => {
      res.status(200).json({
        message: "Ejecucion correcta",
        error: false,
        data: response,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Algo salio mal",
        error: true,
        det_error: error,
      });
    });
};
