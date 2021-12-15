"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renovarToken = exports.verificaTokenDB = exports.verificaToken = void 0;
const Sesion_1 = __importDefault(require("../models/Mongo/Sesion"));
const login_provider_1 = require("../provider/login_provider");
const jwt_1 = require("../helpers/jwt");
exports.verificaToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let token = req.get('token');
        console.log(token);
        const { usuario, exp } = yield jwt_1.decodingJWT(token);
        req.usuario = usuario;
        let [esValido, data] = jwt_1.comprobarJWT(token);
        if (esValido) {
            let sesion = yield Sesion_1.default.findOne({ sesion_id: usuario.sesion_id, token: token });
            if (!sesion) {
                return res.status(401).json({
                    error: true,
                    message: "Sesion expirada"
                });
            }
            else {
                return next();
            }
        }
        //renovar token solo si ya expiro
        if (data.name === 'TokenExpiredError') {
            console.log("el token expiro");
            let sesion = yield Sesion_1.default.findOne({ sesion_id: usuario.sesion_id, token: token });
            if (!sesion) {
                return res.status(401).json({
                    error: true,
                    message: "Sesion expirada"
                });
            }
            else {
                let refreshToken = yield jwt_1.generarJWT(usuario);
                const { exp } = yield jwt_1.decodingJWT(refreshToken);
                sesion.token = refreshToken;
                sesion.fecha_caducidad = new Date(exp * 1000);
                yield sesion.save();
                res.set('refresh-token', refreshToken);
                return next();
            }
        }
        else {
            return res.status(401).json({
                error: true,
                data,
                message: "Token invalido"
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(401).json({
            error: true,
            message: "Token invalido, error interno"
        });
    }
});
exports.verificaTokenDB = (scope) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token = req.get('token');
    try {
        if (!token) {
            throw new Error("El token es obligatorio");
        }
        let resultDB = yield login_provider_1.authTokenService(scope, token);
        if (resultDB.length > 0) {
            next();
        }
        else {
            throw new Error("Permiso denegado");
        }
    }
    catch (error) {
        return res.status(401).json({
            error: true,
            message: error.message
        });
    }
});
exports.renovarToken = (scope) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token = req.get('token');
    try {
        if (!token) {
            throw new Error("El token es obligatorio");
        }
        let resultDB = yield login_provider_1.authTokenService(scope, token);
        if (resultDB.length > 0) {
            next();
        }
        else {
            throw new Error("Permiso denegado");
        }
    }
    catch (error) {
        return res.status(401).json({
            error: true,
            message: error.message
        });
    }
});
//# sourceMappingURL=autenticacion.js.map