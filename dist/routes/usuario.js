"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validar_campos_1 = require("../middlewares/validar-campos");
const usuario_1 = require("../controllers/usuario");
const router = express_1.Router();
const autenticacion_1 = require("../middlewares/autenticacion");
const usuario_middleware_1 = require("../middlewares/usuario_middleware");
router.get('/auditoria/:ideUsuario', autenticacion_1.verificaToken, usuario_1.getAuditoriaUsuario);
//validar que solo sigedin pueda consultar este servicio
router.get('/contacto/:ideUsuario', usuario_1.getUserContacto);
router.get('/infobasica/:ideUsuario', usuario_1.getInfoBasicUser);
router.post('/updateinfouser', [validar_campos_1.verifiDataContacMid], usuario_1.updateInfoUser);
router.get('/verifytokenmail/:token', usuario_1.verifyTokenMail);
router.post('/contacto', [autenticacion_1.verificaToken, usuario_middleware_1.validaupdateContactUser], usuario_1.updateContactUser);
router.post('/changepassword', [autenticacion_1.verificaToken, usuario_middleware_1.validaChangePassword], usuario_1.changePassword);
router.get('/infobasica', [autenticacion_1.verificaToken], usuario_1.getInfoBasicUsuario);
router.post('/decodecedula', usuario_1.getDataCedula);
exports.default = router;
//# sourceMappingURL=usuario.js.map