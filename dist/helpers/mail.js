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
exports.enviaMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
let enviaMail = function (dataMail, mailAuth) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const gmail = mailAuth;
            let transporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: gmail
            });
            let mailOptions = dataMail;
            //mailOptions.from = `Sigedin-ITP <${gmail.user}>`;
            transporter.sendMail(mailOptions, function (err, info) {
                console.log("enviando email...");
                console.log(mailOptions);
                if (err) {
                    console.log(err);
                    reject(err);
                    console.log("Error al enviar el email");
                    //console.error(err);
                }
                else {
                    //    console.log(info);
                    resolve(true);
                }
            });
        });
    });
};
exports.enviaMail = enviaMail;
//# sourceMappingURL=mail.js.map