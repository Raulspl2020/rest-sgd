"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatorCampos = exports.validarIdPago = exports.validarCampos = void 0;
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
        str_tipo_id: "present|string",
        str_nombre_cliente: "required|string",
        str_apellido_cliente: "required|string",
        str_telefono_cliente: "required|string"
        // str_opcional1: "present|string",
        // str_opcional2: "present|string",
        // str_opcional3: "present|string",
        // str_opcional4: "present|string",
        // str_opcional5: "present|string",
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
//# sourceMappingURL=validar-campos.js.map