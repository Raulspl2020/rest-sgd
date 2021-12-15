"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const mail_1 = __importDefault(require("../routes/mail"));
const login_1 = __importDefault(require("../routes/login"));
const estudiante_1 = __importDefault(require("../routes/estudiante"));
const docente_1 = __importDefault(require("../routes/docente"));
const transaccion_1 = __importDefault(require("../routes/transaccion"));
const usuario_1 = __importDefault(require("../routes/usuario"));
const template_1 = __importDefault(require("../routes/template"));
const matricula_1 = __importDefault(require("../routes/matricula"));
const factura_1 = __importDefault(require("../routes/factura"));
const inicio_1 = __importDefault(require("../routes/inicio"));
//====================
//   ROUTES: /api
//=====================
app.get("/", (req, res) => {
    res.json({
        message: "Hola mundo",
        developer: "Duvan Rosero",
        error: false,
        env: process.env.NODE_ENV,
        base_url: process.env.BASE_URL,
    });
});
app.use("/login", login_1.default);
app.use("/mail", mail_1.default);
app.use("/estudiante", estudiante_1.default);
app.use("/transaccion", transaccion_1.default);
app.use("/usuario", usuario_1.default);
app.use("/page", template_1.default);
app.use("/matricula", matricula_1.default);
app.use("/factura", factura_1.default);
app.use("/inicio", inicio_1.default);
app.use("/docente", docente_1.default);
exports.default = app;
//# sourceMappingURL=index.js.map