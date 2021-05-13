import { validationResult } from "express-validator";
let Validator = require("validatorjs");
Validator.useLang("es");
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

export const validarIdPago = (req: any, res: any, next: any) => {
  const validationRule = {
    str_id_pago: "required",
  };

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

export const validatorCampos = (req: any, res: any, next: any) => {


  const validationRule = {
    flt_total_con_iva: "required|numeric",
    flt_valor_iva: "required|numeric",
    str_id_pago: "present|string",
    str_descripcion_pago: "required|string",
    str_email: "required|string|email",
    str_id_cliente: "required|string",
    str_tipo_id: "present|numeric",
    str_nombre_cliente: ['required','string'],
    str_apellido_cliente: "required|string",
    str_telefono_cliente: "required|string",
    str_opcional1: "present|numeric", // codigo paquete
    str_opcional2: "present|string", //valor en letras
    str_opcional3: "numeric", //matricula
    str_opcional4: "string", // periodo
    str_opcional5: "numeric", //categoria pago
  };


  let validation = new Validator(req.body, validationRule);
  //let expresion = /[^`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g;


  if (validation.passes()) {
    next();
  } else {
    res.status(412).send({
      error: true,
      message: "Hay campos obligatorios sin completar",
      errors: validation.errors.all(),
    });
  }
};



//metodos para validar los datos pago en efectivo consumidos por el banco

export const consultaFacturaMid = (req: any, res: any, next: any) => {
  const validationRule = {
    Id_Comercio: "required|numeric",
    Password: "required",
    Id_Banco: "required",
    Referencia_pago: "required|numeric",
    Info_Adicional: "string|present",
  };


  let validation = new Validator(req.body, validationRule);

  if (validation.passes()) {
    next();
  } else {
    res.status(412).send({
      error: true,
      message: "Hay campos obligatorios sin completar",
      errors: validation.errors.all(),
    });
  }
};

export const registrarPagoMid = (req: any, res: any, next: any) => {
  const validationRule = {
    Id_Comercio: "required|numeric",
    Password: "required",
    Id_Banco: "required",
    Referencia_pago: "required|numeric",
    Fecha_pago: "required|string",
    Valor_pagado: "required|numeric",
    Id_transacción: "required|numeric",
    Info_Adicional: "string|present",
  };


  let validation = new Validator(req.body, validationRule);

  if (validation.passes()) {
    next();
  } else {
    res.status(412).send({
      error: true,
      message: "Hay campos obligatorios sin completar",
      errors: validation.errors.all(),
    });
  }
};

export const reversarPagoMid = (req: any, res: any, next: any) => {
  const validationRule = {
    Id_Comercio: "required|numeric",
    Password: "required",
    Id_Banco: "required",
    Referencia_pago: "required|numeric",
    Fecha_reverso: "required|string",
    Valor_pagado: "required|numeric",
    Id_transacción: "required|numeric",
    Info_Adicional: "string|present",
  };


  let validation = new Validator(req.body, validationRule);

  if (validation.passes()) {
    next();
  } else {
    res.status(412).send({
      error: true,
      message: "Hay campos obligatorios sin completar",
      errors: validation.errors.all(),
    });
  }
};