"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
const estudiante_1 = require("../controllers/estudiante");
//====================
//   /estudiante 
//=====================
router.get('/programas', estudiante_1.getProgramaEstudainte);
router.get('/matriculas', estudiante_1.getMatriculaEstudainte);
router.get('/reporte', estudiante_1.getMateriasPerdidasEst);
router.get('/detalle/:ide', estudiante_1.getInfoEstudiante);
router.get('/programas/:id_estudiante', estudiante_1.getProgramaEstudiante);
exports.default = router;
//# sourceMappingURL=estudiante.js.map