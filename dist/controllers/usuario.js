"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserContacto = exports.getAuditoriaUsuario = void 0;
const express_1 = require("express");
const usuarioProvider = __importStar(require("../provider/usuario_provider"));
//====================
//   /usuario/auditoria 
//=====================
exports.getAuditoriaUsuario = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    console.log(req);
    let ideUsuario = req.params.ideUsuario;
    usuarioProvider.auditoria(ideUsuario)
        .then(rows => {
        let json = {};
        if (rows.length) {
            json = {
                data: rows,
                rs: true,
            };
        }
        else {
            json = {
                msj: "No se encontraron resultados",
                rs: false
            };
        }
        res.json(json);
    });
});
//====================
//   /usuario/contacto 
//=====================
exports.getUserContacto = (req, res = express_1.response) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.body;
    console.log(req);
    let ideUsuario = req.params.ideUsuario;
    try {
        let result = yield usuarioProvider.contactoUsuatio(ideUsuario);
        let json = {};
        if (result[0].length) {
            json = {
                data: result,
                rs: true,
            };
        }
        else {
            json = {
                msj: "No se encontraron resultados",
                rs: false
            };
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }
});
//# sourceMappingURL=usuario.js.map