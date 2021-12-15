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
exports.generarCodigoBarras = exports.dividirCodigoBarrasText = exports.generarCodigoBarrasText = exports.ejecutarZonaPagos = exports.dataConfigPago = exports.limpiarCampos = exports.decodeResPago = void 0;
const ResponsePago_1 = require("../models/ResponsePago");
const node_fetch_1 = __importDefault(require("node-fetch"));
const jsbarcode_1 = __importDefault(require("jsbarcode"));
const xmldom_1 = require("xmldom");
exports.decodeResPago = (cadena) => {
    let datos = cadena.split("|");
    // console.log(datos);
    let row = [];
    let matriz = [];
    datos.forEach(element => {
        if ((element.trim().indexOf(';') != -1)) {
            matriz.push(row);
            row = [];
            let aux = element.trim().split(' ');
            if (aux.length > 1) {
                row.push(aux[1]);
            }
            else {
                row.push("");
            }
        }
        else {
            row.push(element.trim());
        }
    });
    let listapagos = [];
    matriz.forEach(dato => {
        let responsePago = new ResponsePago_1.ResponsePago({
            "int_ped_numero": dato[0],
            "int_n_pago": dato[1],
            "int_pago_parcial": dato[2],
            "int_pago_terminado": dato[3],
            "int_estado_pago": dato[4],
            "dbl_valor_pagado": dato[5],
            "dbl_total_pago": dato[6],
            "dbl_valor_iva_pagado": dato[7],
            "str_descripcion": dato[8],
            "str_id_cliente": dato[9],
            "str_nombre": dato[10],
            "str_apellido": dato[11],
            "str_telefono": dato[12],
            "str_email": dato[13],
            "str_campo1": dato[14],
            "str_campo2": dato[15],
            "str_campo3": dato[16],
            "str_campo4": dato[17],
            "str_campo5": dato[18],
            "dat_fecha": dato[19],
            "int_id_forma_pago": dato[20],
            "str_ticketID": dato[21],
            "int_codigo_servicio": dato[22],
            "int_codigo_banco": dato[23],
            "str_nombre_banco": dato[24],
            "str_codigo_transacción": dato[25],
            "int_ciclo_transacción": dato[26]
        });
        listapagos.push(responsePago);
    });
    return listapagos;
};
exports.limpiarCampos = (cadena) => {
    if (cadena == undefined) {
        cadena = "";
    }
    return cadena.toString().replace(/[`~!@#$%^&*¬()_|\-=?;:'",.<>\{\}\[\]\\\/]/gim, '');
};
exports.dataConfigPago = (infoPago) => {
    let data = {
        InformacionPago: infoPago,
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
                //str_valor: "2701", para desarrollo
                //str_valor: "1001", // para produccion
                str_valor: (process.env.NODE_ENV == 'pro') ? "1001" : "2701"
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
                str_valor: "https://sigedin.itp.edu.co/",
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
                str_valor: "0",
            },
            {
                int_codigo: 110,
                str_valor: "0",
            },
        ],
    };
    return data;
};
exports.ejecutarZonaPagos = (body, path) => __awaiter(void 0, void 0, void 0, function* () {
    //INICAMOS EL PAGO CON ZONAPAGOS
    console.log("inicia peticion en zonapagos");
    try {
        let responseZona = yield node_fetch_1.default(process.env.ZONAPAGOS_URL + "/" + path, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        });
        let responseData = yield responseZona.json();
        console.log("Finaliza peticion zonapagos");
        return responseData;
    }
    catch (error) {
        console.log(error);
        return {
            "int_estado": 1,
            "int_error": -1
        };
    }
});
exports.generarCodigoBarrasText = (referencia, valor, fecha) => __awaiter(void 0, void 0, void 0, function* () {
    const convenio415 = "0000000025854";
    let referencia8020 = referencia.toString();
    let valor390n = valor.toString();
    let [dia, mes, año] = fecha.split('-');
    const fecha96 = año + mes + dia;
    const length8020 = 12;
    const length390n = 10;
    try {
        if (referencia8020.length < length8020) {
            let faltante = length8020 - referencia8020.length;
            for (let i = 0; i < faltante; i++) {
                referencia8020 = "0" + referencia8020;
            }
        }
        else if (referencia8020.length > length8020) {
            throw new Error("El codigo de referencia supera el máximo permitido");
        }
        if (valor390n.length < length390n) {
            let faltante = length390n - valor390n.length;
            for (let i = 0; i < faltante; i++) {
                valor390n = "0" + valor390n;
            }
        }
        else if (valor390n.length > length390n) {
            throw new Error("El valor supera el máximo permitido");
        }
        let codigoBarras = "415" + convenio415 + "8020" + referencia8020 + "3900" + valor390n + "96" + fecha96;
        let text = "(415)" + convenio415 + "(8020)" + referencia8020 + "(3900)" + valor390n + "(96)" + fecha96;
        return [codigoBarras, text];
    }
    catch (error) {
        return [null, null];
    }
});
exports.dividirCodigoBarrasText = (cadena) => __awaiter(void 0, void 0, void 0, function* () {
    let convenio415 = cadena.substr(0, 16);
    let referencia8020 = cadena.substr(16, 16);
    let valor3900 = cadena.substr(16 + 16, 14);
    let fecha96 = cadena.substr(16 + 16 + 14, 10);
    return [convenio415,
        referencia8020,
        valor3900,
        fecha96];
});
exports.generarCodigoBarras = (referencia, valor, fecha) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // console.log("referencia",referencia);
        // console.log("valor",valor);
        // console.log("fecha",fecha);
        let [codigoBarras, text] = yield exports.generarCodigoBarrasText(referencia, valor, fecha);
        const xmlSerializer = new xmldom_1.XMLSerializer();
        const document = new xmldom_1.DOMImplementation().createDocument("http://www.w3.org/1999/xhtml", "html", null);
        const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        jsbarcode_1.default(svgNode, codigoBarras, {
            xmlDocument: document,
            height: 50,
            width: 1.13,
            fontSize: 10,
            text: text,
            margin: 2,
        });
        const svgText = xmlSerializer.serializeToString(svgNode);
        return [codigoBarras, svgText];
    }
    catch (error) {
        return [null, null];
    }
});
//# sourceMappingURL=pago.js.map