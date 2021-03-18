"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
const transaccion_1 = require("../controllers/transaccion");
const validar_campos_1 = require("../middlewares/validar-campos");
const corsOptions = {
    origin: function (origin, callback) {
        const whitelist = ['http://127.0.0.1:55f00', 'http://example2.com'];
        //consulat en la base de datos
        // if (whitelist.indexOf(origin) !== -1) {
        //   callback(null, true)
        // } else {
        //   return res.status(300).json({
        //     error: false,
        //     data: "No permitida por CORS",
        // });
        //  // callback(new Error('Not allowed by CORS'));
        // }
    }
};
//router.put('/estado', verificaToken, cors(corsOptions), actualizarTransaccion);
router.put('/estado', transaccion_1.actualizarTransaccion);
router.get('/estado', transaccion_1.actualizarTransaccion);
router.post('/InicioPago', [validar_campos_1.validatorCampos], transaccion_1.inicioPago);
router.post('/VerificacionPago', [validar_campos_1.validarIdPago], transaccion_1.verificaPago);
exports.default = router;
//# sourceMappingURL=transaccion.js.map