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
const cryptoRandomString = require('crypto-random-string');
const Pago_1 = require("../models/Pago");
const node_fetch_1 = __importDefault(require("node-fetch"));
const pago_1 = require("../helpers/pago");
//====================
//   /transaccion/estado
//=====================
exports.actualizarTransaccion = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    res.status(200).json({
        message: "funciona la transaccion",
        codigo: cryptoRandomString({ length: 10, characters: '1124862618DUVANROSERO' }),
        error: false,
    });
});
//====================
//   /transaccion/VerificacionPago
//=====================
exports.verificaPago = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    const data = {
        "int_id_comercio": process.env.ZONAPAGOS_ID,
        "str_usr_comercio": process.env.ZONAPAGOS_USER,
        "str_pwd_comercio": process.env.ZONAPAGOS_PASS,
        "int_no_pago": -1,
        "str_id_pago": body.str_id_pago
    };
    node_fetch_1.default(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
    })
        .then((res) => res.json())
        .then((response) => {
        if (response.int_error == 0) {
            let pagoDecoded = pago_1.decodeResPago(response.str_res_pago);
            res.status(200).json({
                message: response.str_detalle,
                error: false,
                data: pagoDecoded,
                data_server: response.str_res_pago
            });
        }
        else {
            res.status(200).json({
                message: response.str_detalle,
                error: true,
                data: response
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
    let infoPago = new Pago_1.Pago(dataBody);
    console.log(infoPago);
    let data = {
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
    node_fetch_1.default(process.env.ZONAPAGOS_URL + "/InicioPago", {
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
        }
        else {
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
});
//# sourceMappingURL=transaccion.js.map