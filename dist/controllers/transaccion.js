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
exports.inicioPago = exports.verificaPago = exports.actualizarTransaccion = exports.soporteDescuento = void 0;
const express_1 = require("express");
const crypto_random_string_1 = __importDefault(require("crypto-random-string"));
const uuid_1 = require("uuid");
const Pago_1 = require("../models/Pago");
const node_fetch_1 = __importDefault(require("node-fetch"));
const pago_1 = require("../helpers/pago");
const ResponsePago_1 = require("../models/ResponsePago");
const date_format_parse_1 = require("date-format-parse");
const matricula_1 = require("../controllers/matricula");
const subir_archivo_1 = require("../helpers/subir-archivo");
const log_provider_1 = require("../provider/log_provider");
const pago_provider_1 = require("../provider/pago_provider");
const factura_provider_1 = require("../provider/factura_provider");
const matricula_provider_1 = require("../provider/matricula_provider");
const template_1 = require("./template");
const factura_1 = require("./sysapolo/factura");
let Validator = require("validatorjs");
//====================
//   /transaccion/soporteDescuento
//=====================
exports.soporteDescuento = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let metadatos = null;
    let id_config = null;
    try {
        let body = req.body;
        //subir el archivo si existe
        if (req.files && req.files.archivo) {
            const carpeta = `soportedescuento/${body.estudiante_id}-${body.matricula_id}/`;
            const dataFile = yield subir_archivo_1.subirArchivo(req.files, undefined, carpeta);
            console.log(dataFile);
            metadatos = {
                'url': '',
                'extencion': dataFile[1],
                'nombre': dataFile[0],
                'size': dataFile[2],
                'basepath': dataFile[3],
            };
        }
        let resultConfig = yield pago_provider_1.getConfigPeriodo();
        let resultCategoria = yield pago_provider_1.getCategoriaPorcentaje(body.porcentaje_categoria_id);
        console.log(resultCategoria);
        console.log(resultConfig);
        if (resultConfig) {
            id_config = resultConfig._id;
        }
        else {
            throw new Error("No se encontró configuracion activa");
        }
        const dataPorcentaje = {
            estudiante_id: body.estudiante_id,
            porcentaje: (resultCategoria.valor) ? resultCategoria.valor : 0,
            config_id: id_config,
            porcentaje_categoria_id: body.porcentaje_categoria_id,
            matricula_id: body.matricula_id,
            nom_periodo: body.nom_periodo,
            periodo_id: body.periodo_id,
            observacion: body.observacion,
            accion: (body.accion) ? body.accion : 1,
            tipo: (body.accion) ? body.tipo : 0,
            json_file: JSON.stringify(metadatos),
            porcentaje_estado_id: (body.porcentaje_estado_id) ? body.porcentaje_estado_id : 1
        };
        let resultInsert = yield pago_provider_1.guardarProcentajeSoporte(dataPorcentaje);
        res.status(200).json({
            message: "Enviado exitosamente",
            error: false,
            dataPorcentaje
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Servicio no disponible temporalmente",
            error: true,
            det_error: error.message
        });
    }
});
//====================
//   /transaccion/estado
//=====================
//este servicio es consumido con ZONA pagos para la notificacion de un pago
exports.actualizarTransaccion = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let codigo_pago = req.query.id_pago;
    const data = {
        int_id_comercio: process.env.ZONAPAGOS_ID,
        str_usr_comercio: process.env.ZONAPAGOS_USER,
        str_pwd_comercio: process.env.ZONAPAGOS_PASS,
        int_no_pago: -1,
        str_id_pago: codigo_pago
    };
    let estado_pago = 0;
    let fechaUpdate = new Date();
    try {
        let id_pago = yield pago_provider_1.detIdPagoByID(codigo_pago);
        let response = yield node_fetch_1.default(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        });
        let responseData = yield response.json();
        //no se encontraron pago online
        if (responseData.int_estado == 1 && responseData.int_cantidad_pagos == 0) {
            console.log("No se encontro el pago online");
            let data = {
                'is_online': '0'
            };
            let resultDB = yield pago_provider_1.actualizarEstadoPago(data, codigo_pago);
            console.log(resultDB);
        }
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
                let resSavePago = yield savePago(infoPago, null, null);
                id_pago = resSavePago.pago_id;
            }
            let data = {
                'json_detalle': responseData.str_res_pago,
                'estado_id': pagoDecoded[0].int_pago_terminado,
                'is_online': '1',
                'fecha_update': date_format_parse_1.format(fechaUpdate, 'YYYY-MM-DD HH:mm:ss')
            };
            let detPago = [];
            pagoDecoded.forEach((det) => {
                let fechaInsert = fechaUpdate;
                if (det.dat_fecha == '') {
                    fechaInsert = date_format_parse_1.format(fechaUpdate, 'YYYY-MM-DD HH:mm:ss');
                }
                else {
                    fechaInsert = date_format_parse_1.format(date_format_parse_1.parse(det.dat_fecha, "DD/MM/YYYY h:mm:ss A"), 'YYYY-MM-DD HH:mm:ss');
                }
                estado_pago = (det.int_estado_pago == 1) ? det.int_estado_pago : 0;
                detPago.push({
                    '_id': uuid_1.v4(),
                    'pago_id': id_pago,
                    'int_n_pago': (det.int_n_pago == '') ? null : det.int_n_pago,
                    'valor_pago': (det.dbl_valor_pagado == '') ? 0 : det.dbl_valor_pagado,
                    'total_pago': (det.dbl_total_pago == '') ? 0 : det.dbl_total_pago,
                    'valor_iva_pago': (det.dbl_valor_iva_pagado == '') ? 0 : det.dbl_valor_iva_pagado,
                    'estado_pago_id': (det.int_estado_pago == '') ? null : det.int_estado_pago,
                    'forma_pago_id': (det.int_id_forma_pago == '') ? null : det.int_id_forma_pago,
                    'nombre_banco': (det.str_nombre_banco == '') ? null : det.str_nombre_banco,
                    'codigo_transaccion': (det.str_codigo_transacción == '') ? null : det.str_codigo_transacción,
                    'fecha': fechaInsert,
                    'ticketID': (det.str_ticketID == '') ? null : det.str_ticketID,
                    'numero_tarjeta': (det.int_numero_tarjeta == '') ? null : det.int_numero_tarjeta,
                    'franquicia': (det.str_franquicia == '') ? null : det.str_franquicia,
                    'cod_aprobacion': (det.int_cod_aprobacion == '') ? null : det.int_cod_aprobacion,
                    'num_recibido': (det.int_num_recibido == '') ? null : det.int_num_recibido
                });
            });
            //ACTUALIZAMOS EL ESTADO DE CADA DESCUENTO
            if (estado_pago == 1) {
                let resultObjectDB = yield factura_provider_1.consultaFacturaBanco(id_pago);
                let categoria_id = resultObjectDB.data[0].categoria_pago_id;
                if (resultObjectDB != false) {
                    if (categoria_id == 1) {
                        let matricula_id = (resultObjectDB.data[0].matricula_id).toString();
                        let resultMatricula = yield matricula_provider_1.getInfoMatricula(matricula_id);
                        let resultDB = resultMatricula[0][0];
                        //consular los descuentos y multas que un estudiante tiene asignados
                        let resultDto = yield pago_provider_1.getDescuento(categoria_id, resultDB.cod_periodo, resultDB.ide_persona);
                        if (resultDto.length > 0) {
                            let idsDescuento = [];
                            resultDto.forEach((e) => {
                                idsDescuento.push(e._id);
                            });
                            console.log("Se encontraron descuentos");
                            let resultUpdateDB = yield pago_provider_1.updateEstadoDescuentoFac(idsDescuento, id_pago);
                            console.log(resultUpdateDB);
                        }
                        else {
                            console.log("NO Se encontraron descuentos");
                        }
                    }
                }
            }
            //actualiza la fecha y el estado de un pago en la DB
            let resDB = yield pago_provider_1.actualizarEstadoPago(data, codigo_pago);
            //borra y crea los detalles pago: true-false
            let resDb2 = yield pago_provider_1.actualizarPagoyDetalle(id_pago, detPago);
            if (resDb2) {
                let response = {
                    message: "Pago actualizado exitosamente",
                    error: false,
                    data: pagoDecoded,
                    data_server: responseData.str_res_pago,
                };
                if (estado_pago == 1) {
                    //enviar recibo de pago al correo electronico
                    factura_1.registroFacturaSysApolo(codigo_pago);
                    setTimeout(() => template_1.complileTemplateReciboPago(codigo_pago), 60000);
                }
                log_provider_1.guardarLog({
                    'url_service': req.protocol + '://' + req.get('host') + req.originalUrl,
                    'json_body': JSON.stringify(req.query),
                    //'json_response': JSON.stringify(response),
                    'estado': 1,
                    'message': "OK",
                    'host': req.headers['x-forwarded-for'] || req.connection.remoteAddress
                });
                res.status(200).json(response);
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
        console.log(error);
        let response = {
            message: "Servicio no disponible temporalmente",
            error: true,
            det_error: error.message
        };
        log_provider_1.guardarLog({
            'url_service': req.protocol + '://' + req.get('host') + req.originalUrl,
            'json_body': JSON.stringify(req.query),
            'json_response': JSON.stringify(response),
            'estado': 0,
            'message': error.message,
            'host': req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });
        res.status(500).json(response);
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
            let pagoMat = null;
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
            //verificar si es un pago de matricula, si lo es consultar el valor a pagar
            let conceptos = yield pago_provider_1.getConceptosPaquete(infoPago.str_opcional1);
            if (conceptos.length > 0 && conceptos[0].categoria_id == 1 && infoPago.str_opcional3 != "") {
                pagoMat = yield matricula_1.consultarpagoMatricula(infoPago.str_opcional3);
                infoPago.flt_total_con_iva = pagoMat.total_a_pagar_int;
                infoPago.str_opcional3 = pagoMat.matricula.cod_matricula;
                infoPago.str_opcional4 = pagoMat.matricula.cod_periodo;
            }
            //recortamos el tamaño de la descripcion
            let finpago2 = new Pago_1.Pago(infoPago);
            finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(0, -(finpago2.str_descripcion_pago.length - 70));
            let responseZona = yield node_fetch_1.default(process.env.ZONAPAGOS_URL + "/InicioPago", {
                method: "POST",
                body: JSON.stringify(pago_1.dataConfigPago(finpago2)),
                headers: { "Content-Type": "application/json" },
            });
            let responseData = yield responseZona.json();
            if (responseData.int_codigo == 1) {
                let response = yield savePago(infoPago, JSON.stringify(responseData), pagoMat);
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
            message: error.message,
            error: true,
            det_error: error.message,
        });
    }
});
//====================
//   guardarEL pago generado
//=====================
const savePago = (infoPago, responseData, dataMatricula) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("ejecutamos la fucnion de save");
    //pendiente validar precios: si son diferentes mostrar alerta
    let ret = {};
    let paquete_id = infoPago.str_opcional1;
    let tDetallePago = [];
    try {
        //buscamos un paquete por codigo
        let conceptos = yield pago_provider_1.getConceptosPaquete(paquete_id);
        if (conceptos.length > 0) {
            //si es un pago de matricula
            if (dataMatricula !== null) {
                dataMatricula.detalle_factura.forEach((concepto) => {
                    tDetallePago.push({
                        pago_id: null,
                        concepto_id: concepto.concepto_id,
                        descuento: concepto.descuento,
                        aumento: concepto.aumento,
                        valor_unidad: concepto.valor_unidad,
                        cantidad: concepto.cantidad,
                    });
                });
            }
            else {
                conceptos.forEach((concepto) => {
                    tDetallePago.push({
                        pago_id: null,
                        concepto_id: concepto.concepto_id,
                        descuento: concepto.descuento,
                        aumento: concepto.aumento,
                        valor_unidad: concepto.categoria_id == 0
                            ? infoPago.flt_total_con_iva
                            : concepto.valor_unidad,
                        cantidad: concepto.cantidad,
                    });
                });
            }
        }
        else {
            throw new Error("No se encontro el paquete...");
        }
        let tPago = {
            codigo: infoPago.str_id_pago,
            descripcion: infoPago.str_descripcion_pago,
            // json_response: responseData,
            estado_id: 200,
            estudiante_id: infoPago.str_id_cliente,
            matricula_id: (infoPago.str_opcional3 == "") ? null : infoPago.str_opcional3,
            valor: infoPago.flt_total_con_iva,
            valor_letras: infoPago.str_opcional2,
            periodo_id: (infoPago.str_opcional4 == "") ? null : infoPago.str_opcional4,
            //  archivo_id: null,
            cod_paquete: conceptos[0].codigo,
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