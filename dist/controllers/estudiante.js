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
exports.getMatriculaEstudainte = exports.getProgramaEstudainte = void 0;
const estudianteProvider = __importStar(require("../provider/estudiante_provider"));
//====================
//   /estudiante/programas 
//=====================
exports.getProgramaEstudainte = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.query;
    console.log(body);
    try {
        let row = yield estudianteProvider.getPrograma(body.ide_estudiante);
        let programas = row[0];
        let data = {};
        if (row[0].length > 0) {
            return res.status(200).json({
                error: false,
                data: programas,
            });
        }
        else {
            data = {
                message: "No se encontraron resultados",
                error: true,
            };
            res.status(400).json(data);
        }
    }
    catch (error) {
        res.json({
            error: true,
            message: error.message,
        });
    }
});
//====================
//   /estudiante/matriculas 
//=====================
exports.getMatriculaEstudainte = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let body = req.query;
    console.log(body);
    try {
        let row = yield estudianteProvider.getMatricula(body.ide_estudiante, body.ide_programa);
        let matriculas = row[0];
        let data = {};
        if (row[0].length > 0) {
            return res.status(200).json({
                error: false,
                data: matriculas,
            });
        }
        else {
            data = {
                message: "No se encontraron resultados",
                error: true,
            };
            res.status(400).json(data);
        }
    }
    catch (error) {
        res.json({
            error: true,
            message: error.message,
        });
    }
});
//# sourceMappingURL=estudiante.js.map