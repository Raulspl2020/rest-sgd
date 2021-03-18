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
exports.verificaPagosPendientesEfectivo = exports.verificaPagosPendientes = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const pago_provider_1 = require("../provider/pago_provider");
exports.verificaPagosPendientes = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield pago_provider_1.obtenerPagosPendientes(7, [29, 32]);
        if (result[0].length > 0) {
            let responseZona = yield node_fetch_1.default(`${process.env.BASE_URL}/transaccion/estado?id_pago=${result[0][0].codigo}`);
            let responseData = yield responseZona.json();
            console.log("Ejecutando tarea de verificacion");
            return responseData;
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
exports.verificaPagosPendientesEfectivo = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield pago_provider_1.obtenerPagosPendientes(60, [41, 42]);
        if (result[0].length > 0) {
            let responseZona = yield node_fetch_1.default(`${process.env.BASE_URL}/transaccion/estado?id_pago=${result[0][0].codigo}`);
            let responseData = yield responseZona.json();
            console.log("Ejecutando tarea de verificacion");
            return responseData;
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
//# sourceMappingURL=cron_job.js.map