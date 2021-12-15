"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifiDataContacMid = exports.pagoVariosMid = exports.pagoPersonalizadoMid = exports.actualizarPago = exports.reversarPagoMid = exports.registrarPagoMid = exports.consultaFacturaMid = exports.validatorCampos = exports.validarIdPago = exports.validarCampos = void 0;
const express_validator_1 = require("express-validator");
let Validator = require("validatorjs");
Validator.useLang("es");
//import * as Validator from 'validatorjs';
exports.validarCampos = (req, res, next) => {
    const errores = express_validator_1.validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({
            message: "Se han encontrado errores de validacion",
            det_error: errores.mapped(),
            error: true,
        });
    }
    next();
};
exports.validarIdPago = (req, res, next) => {
    const validationRule = {
        str_id_pago: "required",
    };
    let validation = new Validator(req.body, validationRule);
    if (validation.passes()) {
        next();
    }
    else {
        res.status(412).send({
            error: true,
            message: "Validacion fallida",
            errors: validation.errors.all(),
        });
    }
};
exports.validatorCampos = (req, res, next) => {
    const validationRule = {
        flt_total_con_iva: "required|numeric",
        flt_valor_iva: "required|numeric",
        str_id_pago: "present|string",
        str_descripcion_pago: "required|string",
        str_email: "required|string|email",
        str_id_cliente: "required|string",
        str_tipo_id: "present|numeric",
        str_nombre_cliente: ['required', 'string'],
        str_apellido_cliente: "required|string",
        str_telefono_cliente: "required|string",
        str_opcional1: "present|numeric",
        str_opcional2: "present|string",
        str_opcional3: "numeric",
        str_opcional4: "string",
        str_opcional5: "numeric",
    };
    let validation = new Validator(req.body, validationRule);
    //let expresion = /[^`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g;
    if (validation.passes()) {
        next();
    }
    else {
        res.status(412).send({
            error: true,
            message: "Hay campos obligatorios sin completar",
            errors: validation.errors.all(),
        });
    }
};
//metodos para validar los datos pago en efectivo consumidos por el banco
exports.consultaFacturaMid = (req, res, next) => {
    console.log("Disparando middleware");
    console.log(req.body);
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
    }
    else {
        res.status(412).send({
            error: true,
            message: "Hay campos obligatorios sin completar",
            errors: validation.errors.all(),
        });
    }
};
exports.registrarPagoMid = (req, res, next) => {
    console.log("Disparando middleware");
    console.log(req.body);
    const validationRule = {
        Id_Comercio: "required|numeric",
        Password: "required",
        Id_Banco: "required",
        Referencia_pago: "required|numeric",
        Fecha_pago: "required|string",
        Valor_pagado: "required|numeric",
        Id_transaccion: "required|numeric",
        Info_adicional: "string|present",
    };
    let validation = new Validator(req.body, validationRule);
    if (validation.passes()) {
        next();
    }
    else {
        res.status(412).send({
            error: true,
            message: "Hay campos obligatorios sin completar",
            errors: validation.errors.all(),
        });
    }
};
exports.reversarPagoMid = (req, res, next) => {
    console.log("Disparando middleware");
    console.log(req.body);
    const validationRule = {
        Id_Comercio: "required|numeric",
        Password: "required",
        Id_Banco: "required",
        Referencia_pago: "required|numeric",
        Fecha_reverso: "required|string",
        Valor_pagado: "required|numeric",
        Id_transaccion: "required|numeric",
        Info_adicional: "string|present",
    };
    let validation = new Validator(req.body, validationRule);
    if (validation.passes()) {
        next();
    }
    else {
        res.status(412).send({
            error: true,
            message: "Hay campos obligatorios sin completar",
            errors: validation.errors.all(),
        });
    }
};
// validar servicio consumido por zonapagos para actualizar el estado de un pago
exports.actualizarPago = (req, res, next) => {
    console.log("Disparando middleware");
    console.log(req.query);
    const validationRule = {
        id_pago: "required|string"
    };
    let validation = new Validator(req.query, validationRule);
    if (validation.passes()) {
        next();
    }
    else {
        res.status(412).send({
            error: true,
            message: "Hay campos obligatorios sin completar",
            errors: validation.errors.all(),
        });
    }
};
//valida los campos enviados desde el formualrio de pago personalizado
exports.pagoPersonalizadoMid = (req, res, next) => {
    console.log("Disparando middleware");
    console.log(req.body);
    const validationRule = {
        isPagoOnline: "required|boolean",
        total: "required|numeric",
        des_concepto: "string|present",
        email_persona: "required|string|email",
        id_persona: "required|string",
        tipo_id: "required|numeric",
        tipo_id_text: "present|string",
        nombre1: "required|string",
        nombre2: "present|string",
        apellido1: "required|string",
        apellido2: "present|string",
        cel_persona: "required|string",
        str_opcional2: "present|string",
    };
    let validation = new Validator(req.body, validationRule);
    if (validation.passes()) {
        next();
    }
    else {
        res.status(412).send({
            error: true,
            message: "Hay campos obligatorios sin completar",
            errors: validation.errors.all(),
        });
    }
};
//valida los campos enviados desde el formualrio de pago personalizado
exports.pagoVariosMid = (req, res, next) => {
    console.log("Disparando middleware");
    console.log(req.body);
    const validationRule = {
        isPagoOnline: "required|boolean",
        total: "required|numeric",
        des_concepto: "string|present",
        email_persona: "required|string|email",
        id_persona: "required|string",
        tipo_id: "required|numeric",
        tipo_id_text: "present|string",
        nombre1: "required|string",
        nombre2: "present|string",
        apellido1: "required|string",
        apellido2: "present|string",
        cel_persona: "required|string",
        str_opcional2: "present|string",
        id_paquete: "required|numeric",
        id_programa_persona: "required|numeric",
    };
    let validation = new Validator(req.body, validationRule);
    if (validation.passes()) {
        next();
    }
    else {
        res.status(412).send({
            error: true,
            message: "Hay campos obligatorios sin completar",
            errors: validation.errors.all(),
        });
    }
};
//valida los campos enviados desde el formualrio de pago personalizado
exports.verifiDataContacMid = (req, res, next) => {
    console.log("Disparando middleware");
    console.log(req.body);
    const validationRule = {
        id_usuario: "required|string",
        email: "required|email",
        celular: "present|numeric",
        direccion: "present|string",
    };
    let validation = new Validator(req.body, validationRule);
    if (validation.passes()) {
        next();
    }
    else {
        res.status(412).send({
            error: true,
            message: "Hay campos obligatorios sin completar",
            errors: validation.errors.all(),
        });
    }
};
//# sourceMappingURL=validar-campos.js.map