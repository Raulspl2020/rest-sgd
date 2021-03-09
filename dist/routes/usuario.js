"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuario_1 = require("../controllers/usuario");
const router = express_1.Router();
const autenticacion_1 = require("../middlewares/autenticacion");
router.get('/auditoria/:ideUsuario', autenticacion_1.verificaToken, usuario_1.getAuditoriaUsuario);
//validar que solo sigedin pueda consultar este servicio
router.get('/contacto/:ideUsuario', usuario_1.getUserContacto);
exports.default = router;
//# sourceMappingURL=usuario.js.map