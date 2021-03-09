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
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodingJWT = exports.comprobarJWT = exports.crearTokenAux = exports.generarJWT = void 0;
const jwt = require("jsonwebtoken");
exports.generarJWT = (payload, caducidad = process.env.CADUCIDAD_TOKEN) => {
    return new Promise((resolve, reject) => {
        jwt.sign({ usuario: payload }, process.env.SECRET_KEY, { expiresIn: caducidad, }, (err, token) => {
            if (err) {
                //no se pudo crear el token
                reject("No se pudo crear el token, " + err.message);
            }
            else {
                //TOKEN
                resolve(token);
            }
        });
    });
};
exports.crearTokenAux = function (data, ex) {
    return __awaiter(this, void 0, void 0, function* () {
        var caducidad = 60 * 15; //tiempo de vida del toquen 10min 60 * 10
        let token = yield jwt.sign(data, process.env.SECRET_KEY, { expiresIn: caducidad });
        return token;
    });
};
exports.comprobarJWT = (token) => {
    try {
        const data = jwt.verify(token, process.env.SECRET_KEY);
        return [true, data];
    }
    catch (error) {
        return [false, null];
    }
};
exports.decodingJWT = (token) => {
    console.log('decoding JWT token');
    if (token !== null || token !== undefined) {
        // const base64String = token.split('.')[1];
        // const decodedValue = JSON.parse(Buffer.from(base64String, 'base64').toString('ascii'));
        // console.log(decodedValue);
        return jwt.decode(token);
    }
    return null;
};
//# sourceMappingURL=jwt.js.map