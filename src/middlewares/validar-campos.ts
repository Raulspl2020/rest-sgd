import { validationResult } from "express-validator";
let Validator = require("validatorjs");
//import * as Validator from 'validatorjs';

export const validarCampos = (req: any, res: any, next: any) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      message: "Se han encontrado errores de validacion",
      det_error: errores.mapped(),
      error: true,
    });
  }
  next();
};

export const validatorCampos = (req: any, res: any, next: any) => {
  const validationRule = {
    flt_total_con_iva: "required|numeric",
    flt_valor_iva: "required|numeric",
    str_id_pago: "present|string",
    str_descripcion_pago: "required|string",
    str_email: "required|string|email",
    str_id_cliente: "required|string",
    str_tipo_id: "present|string",
    str_nombre_cliente: "required|string",
    str_apellido_cliente: "required|string",
    str_telefono_cliente: "required|string",
    str_opcional1: "present|string",
    str_opcional2: "present|string",
    str_opcional3: "present|string",
    str_opcional4: "present|string",
    str_opcional5: "present|string",
  };
  Validator.useLang("es");

  let validation = new Validator(req.body, validationRule);

  if (validation.passes()) {
    next();
  } else {
    res.status(412).send({
      error: true,
      message: "Validacion fallida",
      errors: validation.errors.all(),
    });
  }
};
