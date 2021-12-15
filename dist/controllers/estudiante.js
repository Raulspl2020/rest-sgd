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
exports.getProgramaEstudiante = exports.getInfoEstudiante = exports.getMateriasPerdidasEst = exports.getMatriculaEstudainte = exports.getProgramaEstudainte = void 0;
const date_format_parse_1 = require("date-format-parse");
const estudianteProvider = __importStar(require("../provider/estudiante_provider"));
const estudiante_provider_1 = require("../provider/estudiante_provider");
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
exports.getMateriasPerdidasEst = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let resultDB = yield estudiante_provider_1.getEstMatriculados();
        let cont = 0;
        for (const row of resultDB) {
            let res = yield estudiante_provider_1.getMateriasEstudiante(row.cod_periodo, row.id_programa_persona, row.NUM_DOCUMENTO);
            resultDB[cont].perdidas = (res == false) ? 0 : res[0].perdidas;
            cont++;
        }
        // resultDB.asyncForEach([1, 2, 3], async (num) => {
        //     let res =  await  getMateriasEstudiante(row.cod_periodo,row.id_programa_persona, row.NUM_DOCUMENTO);
        //   });
        res.json(resultDB);
    }
    catch (error) {
        console.log(error);
        res.json({
            error: true,
            message: error.message,
        });
    }
});
exports.getInfoEstudiante = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let serviceName = "estudiante.detalle";
    let ide_estuduante = req.params.ide;
    let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log(fullUrl);
    console.log(req.originalUrl);
    let estudiante = {};
    let programas = [];
    let matriculas = [];
    let programasArray = [];
    let prooo = [];
    try {
        let resultDB = yield estudiante_provider_1.getInfoEstudianteProv(ide_estuduante);
        if (resultDB == false) {
            throw new Error("No se encontró el estudiante");
        }
        for (const row of resultDB) {
            estudiante.ide_persona = row.ide_persona;
            estudiante.tipo_documento = row.tipo_documento;
            estudiante.fec_expedicion_doc = date_format_parse_1.format(row.fec_expedicion_doc, 'DD-MM-YYYY');
            ;
            estudiante.ape1_persona = row.ape1_persona;
            estudiante.ape2_persona = row.ape2_persona;
            estudiante.nom1_persona = row.nom1_persona;
            estudiante.nom2_persona = row.nom2_persona;
            estudiante.fech_nac_persona = date_format_parse_1.format(row.fech_nac_persona, 'DD-MM-YYYY');
            estudiante.munucipio_expedicion = row.munucipio_expedicion;
            estudiante.nom_genero = row.nom_genero;
            estudiante.dir_persona = row.dir_persona;
            estudiante.tel_persona = row.tel_persona;
            estudiante.cel_persona = row.cel_persona;
            estudiante.email_persona = row.email_persona;
            estudiante.email_institucion = row.email_institucion;
            if (!programas.includes(row.programa)) {
                programas.push(row.programa);
            }
        }
        for (const programa of programas) {
            for (const row of resultDB) {
                if (programa == row.programa) {
                    let encontrado = false;
                    for (const aux of prooo) {
                        if (aux.nom_programa == programa) {
                            encontrado = true;
                        }
                    }
                    if (!encontrado) {
                        prooo.push({
                            nom_programa: programa,
                            estado: row.nom_estadoinscripcion,
                            cod_snies: row.cod_snies
                        });
                    }
                }
            }
        }
        let programaUnico = [];
        for (const programa of prooo) {
            let mat = [];
            for (const row of resultDB) {
                if (programa.nom_programa == row.programa) {
                    mat.push({
                        cod_matricula: row.cod_matricula,
                        sede: row.sede,
                        periodo: row.periodo,
                        semestre: row.semestre,
                        estado: row.nom_estadomatricula,
                        fecha_matricula: date_format_parse_1.format(row.fecha_matricula, 'DD-MM-YYYY')
                    });
                }
            }
            programa.matriculas = mat;
            programasArray.push(programa);
        }
        estudiante.programas = programasArray;
        res.json(estudiante);
    }
    catch (error) {
        console.log(error);
        res.json({
            error: true,
            message: error.message,
        });
    }
});
//====================
//   /estudiante/programas 
//=====================
exports.getProgramaEstudiante = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let id_estudiante = req.params.id_estudiante;
    try {
        let resultDB = yield estudiante_provider_1.getProgramasEstudiante(id_estudiante);
        console.log(resultDB);
        res.status(200).json({
            error: false,
            message: "ejecucion correcta",
            data: resultDB
        });
    }
    catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});
//# sourceMappingURL=estudiante.js.map