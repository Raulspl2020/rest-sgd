"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inicioPago = exports.verificaPago = exports.actualizarTransaccion = void 0;
const express_1 = require("express");
const crypto_random_string_1 = __importDefault(require("crypto-random-string"));
const uuid_1 = require("uuid");
const Pago_1 = require("../models/Pago");
const node_fetch_1 = __importDefault(require("node-fetch"));
const pago_1 = require("../helpers/pago");
const ResponsePago_1 = require("../models/ResponsePago");
const date_format_parse_1 = require("date-format-parse");
const pago_provider_1 = require("../provider/pago_provider");
let Validator = require("validatorjs");
//====================
//   /transaccion/estado
//=====================
exports.actualizarTransaccion = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let codigo_pago = req.query.id_pago;
    const data = {
        int_id_comercio: process.env.ZONAPAGOS_ID,
        str_usr_comercio: process.env.ZONAPAGOS_USER,
        str_pwd_comercio: process.env.ZONAPAGOS_PASS,
        int_no_pago: -1,
        str_id_pago: codigo_pago
    };
    let fechaUpdate = new Date();
    try {
        let id_pago = yield pago_provider_1.detIdPagoByCodigo(codigo_pago);
        console.log("inicia la consulta");
        let response = yield node_fetch_1.default(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        });
        let responseData = yield response.json();
        if (responseData.int_error == 0) {
            const resss = new ResponsePago_1.ListResponsePago();
            let pagoDecoded = resss.decodePagoToList(responseData.str_res_pago);
            let dataBody = pagoDecoded[0];
            if (id_pago == false) {
                //insertar el pago en la DB
                let infoPago = new Pago_1.Pago({
                    flt_total_con_iva: dataBody.dbl_total_pago,
                    flt_valor_iva: dataBody.dbl_valor_iva_pagado,
                    str_id_pago: pago_1.limpiarCampos(codigo_pago),
                    str_descripcion_pago: pago_1.limpiarCampos(dataBody.str_descripcion),
                    str_email: dataBody.str_email,
                    str_id_cliente: pago_1.limpiarCampos(dataBody.str_id_cliente),
                    str_tipo_id: pago_1.limpiarCampos(dataBody.str_tipo_id),
                    str_nombre_cliente: pago_1.limpiarCampos(dataBody.str_nombre_cliente),
                    str_apellido_cliente: pago_1.limpiarCampos(dataBody.str_apellido_cliente),
                    str_telefono_cliente: pago_1.limpiarCampos(dataBody.str_telefono_cliente),
                    str_opcional1: pago_1.limpiarCampos(dataBody.str_campo1),
                    str_opcional2: pago_1.limpiarCampos(dataBody.str_campo2),
                    str_opcional3: pago_1.limpiarCampos(dataBody.str_campo3),
                    str_opcional4: pago_1.limpiarCampos(dataBody.str_campo4),
                    str_opcional5: pago_1.limpiarCampos(dataBody.str_campo5),
                });
                let resSavePago = yield savePago(infoPago, null);
                id_pago = resSavePago.pago_id;
            }
            let data = {
                'json_detalle': responseData.str_res_pago,
                'estado_id': pagoDecoded[0].int_pago_terminado,
                'fecha_update': date_format_parse_1.format(fechaUpdate, 'YYYY-MM-DD HH:mm:ss')
            };
            let detPago = [];
            pagoDecoded.forEach((det) => {
                detPago.push({
                    '_id': uuid_1.v4(),
                    'pago_id': id_pago,
                    'valor_pago': det.dbl_valor_pagado,
                    'total_pago': det.dbl_total_pago,
                    'valor_iva_pago': det.dbl_valor_iva_pagado,
                    'estado_pago_id': (det.int_estado_pago == '') ? null : det.int_estado_pago,
                    'forma_pago_id': (det.int_id_forma_pago == '') ? null : det.int_id_forma_pago,
                    'nombre_banco': (det.str_nombre_banco == '') ? null : det.str_nombre_banco,
                    'codigo_transaccion': (det.str_codigo_transacción == '') ? null : det.str_codigo_transacción,
                    'fecha': date_format_parse_1.format(date_format_parse_1.parse(det.dat_fecha, "DD/MM/YYYY h:mm:ss A"), 'YYYY-MM-DD HH:mm:ss'),
                    'ticketID': (det.str_ticketID == '') ? null : det.str_ticketID,
                    'numero_tarjeta': (det.int_numero_tarjeta == '') ? null : det.int_numero_tarjeta,
                    'franquicia': (det.str_franquicia == '') ? null : det.str_franquicia,
                    'cod_aprobacion': (det.int_cod_aprobacion == '') ? null : det.int_cod_aprobacion,
                    'num_recibido': (det.int_num_recibido == '') ? null : det.int_num_recibido
                });
            });
            //actualiza la fecha y el estado de un pago en la DB
            let resDB = yield pago_provider_1.actualizarEstadoPago(data, codigo_pago);
            //borra y crea los detalles pago: true-false
            let resDb2 = yield pago_provider_1.actualizarPagoyDetalle(id_pago, detPago);
            if (resDb2) {
                res.status(200).json({
                    message: "Pago actualizado exitosamente",
                    error: false,
                    data: pagoDecoded,
                    data_server: responseData.str_res_pago,
                });
            }
            else {
                throw new Error("No se ha podido insertar los detalle de pago");
            }
        }
        else {
            throw new Error("Error de comunicacion con zonapagos o código no encontrado");
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Servicio no disponible temporalmente",
            error: true,
            det_error: error.message
        });
    }
});
//====================
//   /transaccion/VerificacionPago
//=====================
exports.verificaPago = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    const data = {
        int_id_comercio: process.env.ZONAPAGOS_ID,
        str_usr_comercio: process.env.ZONAPAGOS_USER,
        str_pwd_comercio: process.env.ZONAPAGOS_PASS,
        int_no_pago: -1,
        str_id_pago: body.str_id_pago,
    };
    node_fetch_1.default(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
    })
        .then((res) => res.json())
        .then((response) => {
        if (response.int_error == 0) {
            const resss = new ResponsePago_1.ListResponsePago();
            let pagoDecoded = resss.decodePagoToList(response.str_res_pago);
            res.status(200).json({
                message: response.str_detalle,
                error: false,
                data: pagoDecoded,
                data_server: response.str_res_pago,
            });
        }
        else {
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
});
//====================
//   /transaccion/InicioPago
//=====================
exports.inicioPago = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let dataBody = req.body;
    try {
        let infoPago = new Pago_1.Pago({
            flt_total_con_iva: dataBody.flt_total_con_iva,
            flt_valor_iva: dataBody.flt_valor_iva,
            str_id_pago: pago_1.limpiarCampos(dataBody.str_id_pago),
            str_descripcion_pago: pago_1.limpiarCampos(dataBody.str_descripcion_pago),
            str_email: dataBody.str_email,
            str_id_cliente: pago_1.limpiarCampos(dataBody.str_id_cliente),
            str_tipo_id: pago_1.limpiarCampos(dataBody.str_tipo_id),
            str_nombre_cliente: pago_1.limpiarCampos(dataBody.str_nombre_cliente),
            str_apellido_cliente: pago_1.limpiarCampos(dataBody.str_apellido_cliente),
            str_telefono_cliente: pago_1.limpiarCampos(dataBody.str_telefono_cliente),
            str_opcional1: pago_1.limpiarCampos(dataBody.str_opcional1),
            str_opcional2: pago_1.limpiarCampos(dataBody.str_opcional2),
            str_opcional3: pago_1.limpiarCampos(dataBody.str_opcional3),
            str_opcional4: pago_1.limpiarCampos(dataBody.str_opcional4),
            str_opcional5: pago_1.limpiarCampos(dataBody.str_opcional5),
        });
        //si no se envia el codigo se crea un nuevo pago
        if (dataBody.str_id_pago == "") {
            //generamos el codigo
            let cadena = dataBody.str_nombre_cliente +
                dataBody.str_apellido_cliente +
                dataBody.str_id_cliente.trim();
            cadena = pago_1.limpiarCampos(cadena.replace(/\s+/g, ""));
            let validation;
            let contador = 0;
            //si el codigo no es afanumerico se genera otro
            do {
                let codigo = yield crypto_random_string_1.default({
                    length: 10,
                    characters: cadena,
                });
                let regla = {
                    'cadena': 'present|alpha_num'
                };
                let campos = {
                    'cadena': codigo
                };
                validation = new Validator(campos, regla);
                infoPago.str_id_pago = codigo;
                contador++;
                if (contador > 1000) {
                    throw new Error("No se ha podido generar el codigo");
                }
            } while (validation.fails());
            let responseZona = yield node_fetch_1.default(process.env.ZONAPAGOS_URL + "/InicioPago", {
                method: "POST",
                body: JSON.stringify(pago_1.dataConfigPago(infoPago)),
                headers: { "Content-Type": "application/json" },
            });
            let responseData = yield responseZona.json();
            if (responseData.int_codigo == 1) {
                let response = yield savePago(infoPago, JSON.stringify(responseData));
                res.status(response.statusCode).json(response);
            }
            else {
                throw new Error("Parámetros enviados de forma incorrecta");
            }
        }
        else {
            let response = yield updatePago(infoPago);
            res.status(response.statusCode).json(response);
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error.message,
        });
    }
});
//====================
//   guardarEL pago generado
//=====================
const savePago = (infoPago, responseData) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("ejecutamos la fucnion de save");
    //pendiente validar precios: si son diferentes mostrar alerta
    let ret = {};
    let paquete_id = infoPago.str_opcional1;
    let tDetallePago = [];
    try {
        let conceptos = yield pago_provider_1.getConceptosPaquete(paquete_id);
        if (conceptos.length > 0) {
            conceptos.forEach((concepto) => {
                tDetallePago.push({
                    pago_id: null,
                    concepto_id: concepto._id,
                    descuento: concepto.descuento,
                    aumento: concepto.aumento,
                    valor_unidad: concepto.categoria_id == 0
                        ? infoPago.flt_total_con_iva
                        : concepto.valor_unidad,
                    cantidad: concepto.cantidad,
                });
            });
        }
        else {
            throw new Error("No se encontro el paquete...");
        }
        let tPago = {
            codigo: infoPago.str_id_pago,
            descripcion: infoPago.str_descripcion_pago,
            json_response: responseData,
            estado_id: 200,
            estudiante_id: infoPago.str_id_cliente,
            matricula_id: (infoPago.str_opcional3 == "") ? null : infoPago.str_opcional3,
            valor: infoPago.flt_total_con_iva,
            valor_letras: infoPago.str_opcional2,
            periodo_id: (infoPago.str_opcional4 == "") ? null : infoPago.str_opcional4,
            archivo_id: null,
            categoria_pago_id: conceptos[0].categoria_id,
        };
        //guardar el detalle de la factura
        let resultSavePago = yield pago_provider_1.guardarPagoyDetalle(tPago, tDetallePago);
        if (resultSavePago != false) {
            ret = {
                statusCode: 200,
                message: "Ejecucion correcta",
                error: false,
                pago_id: resultSavePago,
                data: JSON.parse(responseData),
            };
            return ret;
        }
        else {
            throw new Error("No se ha podido guardar el pago");
        }
    }
    catch (error) {
        ret = {
            statusCode: 500,
            message: error.message,
            error: true,
            det_error: error,
        };
        return ret;
    }
});
const updatePago = (infoPago) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("ejecutamos la fucnion de update");
    let ret = {
        message: "Listo para actualizar",
        error: false,
        statusCode: 200,
    };
    return ret;
});
//# sourceMappingURL=transaccion.js.map