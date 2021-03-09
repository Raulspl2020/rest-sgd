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
exports.default = router;
//# sourceMappingURL=estudiante.js.map