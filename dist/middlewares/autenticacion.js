"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificaToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.verificaToken = (req, res, next) => {
    let token = req.get('token');
    jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        console.log('token: ' + decoded);
        if (err) {
            return res.status(401).json({
                error: true,
                data: err,
                message: "Token invalido"
            });
        }
        req.usuario = decoded.usuario;
        next();
    });
};
//# sourceMappingURL=autenticacion.js.map