"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
const autenticacion_1 = require("../middlewares/autenticacion");
//====================
//   /inicio
//=====================
router.get('/', autenticacion_1.verificaToken, (req, res) => {
    res.json(req.usuario);
});
exports.default = router;
//# sourceMappingURL=inicio.js.map