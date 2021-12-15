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
exports.verificaPagosNpago = exports.verificaPagosPendientesOnline = exports.verificaPagosPendientes = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const ResponsePago_1 = require("../models/ResponsePago");
const pago_provider_1 = require("../provider/pago_provider");
const uuid_1 = require("uuid");
const date_format_parse_1 = require("date-format-parse");
// pendiente borrar los pagos que lleven mas de 7 dias iniciados y no tengan detalle_pago
exports.verificaPagosPendientes = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield pago_provider_1.obtenerPagosPendientes(7, [29, 32]);
        if (result != false) {
            result.forEach((row) => {
                node_fetch_1.default(`${process.env.BASE_URL}/transaccion/estado?id_pago=${row.codigo}`)
                    .then(response => response.json())
                    .then((responseData) => {
                    console.log("Ejecutando tarea de verificacion");
                    return responseData;
                });
            });
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.log(error);
        return false;
    }
});
exports.verificaPagosPendientesOnline = () => __awaiter(void 0, void 0, void 0, function* () {
    let minutos = (process.env.TIEMPO_VERIFICACION_MIN == undefined) ? 7 : parseInt(process.env.TIEMPO_VERIFICACION_MIN.toString());
    try {
        let result = yield pago_provider_1.getPagosOnlinePendientes(minutos);
        if (result != false) {
            result.forEach((row) => {
                if (row.estado_pago_id == 999 || row.estado_pago_id == 4001 || row.estado_pago_id == null || row.estado_pago_id == 200 || row.estado_pago_id == 888) {
                    node_fetch_1.default(`${process.env.BASE_URL}/transaccion/estado?id_pago=${row.id_factura}`)
                        .then(response => response.json())
                        .then((responseData) => {
                        console.log("Ejecutando tarea de verificacion");
                        return responseData;
                    });
                }
                else {
                    console.log(`el pago con id:${row.id_pago}(${row.id_factura}) no cumple las condiciones para verificar`);
                }
            });
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.log("Error de SONDA");
        console.log(error);
        return false;
    }
});
// se usa para reconstruir todos los pagos
exports.verificaPagosNpago = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resultDB = yield pago_provider_1.consultaPagosSINNPAGO();
        console.log("Iniciamos la verificacion");
        for (const row of resultDB) {
            const data = {
                int_id_comercio: process.env.ZONAPAGOS_ID,
                str_usr_comercio: process.env.ZONAPAGOS_USER,
                str_pwd_comercio: process.env.ZONAPAGOS_PASS,
                int_no_pago: -1,
                str_id_pago: row.pago_id
            };
            let response = yield node_fetch_1.default(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });
            let responseData = yield response.json();
            let detPago = [];
            //si encuentra los pagos
            if (responseData.int_error == 0 && responseData.int_cantidad_pagos > 0) {
                console.log("encontrado: " + row.pago_id);
                const resss = new ResponsePago_1.ListResponsePago();
                let pagoDecoded = resss.decodePagoToList(responseData.str_res_pago);
                pagoDecoded.forEach((det) => {
                    let fechaUpdate = new Date();
                    let fechaInsert = new Date();
                    if (det.dat_fecha == '') {
                        fechaInsert = date_format_parse_1.format(fechaUpdate, 'YYYY-MM-DD HH:mm:ss');
                    }
                    else {
                        fechaInsert = date_format_parse_1.format(date_format_parse_1.parse(det.dat_fecha, "DD/MM/YYYY h:mm:ss A"), 'YYYY-MM-DD HH:mm:ss');
                    }
                    detPago.push({
                        '_id': uuid_1.v4(),
                        'pago_id': row.pago_id,
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
                let resDb2 = yield pago_provider_1.actualizarPagoyDetalleVeri(row.pago_id, detPago);
                console.log("Respuesta de BD");
                console.log(resDb2);
            }
        }
    }
    catch (error) {
        console.log(error);
    }
});
//# sourceMappingURL=cron_job.js.map