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
exports.validarGoogleIdToken = exports.validateGoogleIdToken = void 0;
const google_auth_library_1 = require("google-auth-library");
const node_fetch_1 = __importDefault(require("node-fetch"));
const CLIENT_ID = process.env.GOOGLE_ID;
const client = new google_auth_library_1.OAuth2Client(CLIENT_ID);
const validarGoogleIdToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    //console.log(token);
    try {
        const ticket = yield client.verifyIdToken({
            idToken: token,
            audience: [
                CLIENT_ID,
                process.env.GOOGLE_CLIENT_MOVIL_ID,
            ],
        });
        const payload = ticket.getPayload();
        console.log("=============PAYLOAD====================");
        console.log(payload);
        const userid = payload["sub"];
        console.log(payload);
        return {
            name: payload["name"],
            picture: payload["picture"],
            email: payload["email"],
        };
    }
    catch (error) {
        console.log(error);
        return null;
    }
});
exports.validarGoogleIdToken = validarGoogleIdToken;
exports.validateGoogleIdToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let response = yield node_fetch_1.default(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (response.status == 200) {
            let payload = yield response.json();
            return {
                name: payload["name"],
                picture: payload["picture"],
                email: payload["email"],
            };
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.log(error);
        return null;
    }
});
//# sourceMappingURL=google-verify-token.js.map