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
exports.extractColDocumentData = exports.capitalize = exports.createQR = exports.generarHTMLPDFNew = exports.generarHTMLPDF = exports.convertTo24Hour = void 0;
const moment_1 = __importDefault(require("moment"));
const puppeteer = require("puppeteer");
const { createCanvas, loadImage } = require("canvas");
const qrcode_1 = __importDefault(require("qrcode"));
exports.convertTo24Hour = (time) => {
    let hours = parseInt(time.substr(0, 2));
    if (time.indexOf('AM') != -1 && hours == 12) {
        time = time.replace('12', '0');
    }
    if (time.indexOf('PM') != -1 && hours < 12) {
        time = time.replace(hours.toString(), (hours + 12).toString());
    }
    return time.replace(/(AM|PM)/, '');
};
exports.generarHTMLPDF = (html) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const browser = yield puppeteer.launch({
            args: [
                "--no-sandbox",
                "--headless",
                "--disable-gpu",
                "--disable-setuid-sandbox",
            ],
        });
        const page = yield browser.newPage();
        yield page.setContent(html);
        const pdf = yield page.pdf({
            format: "Letter",
            printBackground: true,
        });
        console.log("Pdf generado");
        yield browser.close();
        return pdf;
    }
    catch (error) {
        throw new Error(error.message);
    }
});
exports.generarHTMLPDFNew = (html) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const browser = yield puppeteer.launch({
            args: [
                "--no-sandbox",
                "--headless",
                "--disable-gpu",
                '--start-maximized',
                "--disable-setuid-sandbox",
            ]
        });
        const page = yield browser.newPage();
        yield page.setContent(html);
        const pdf = yield page.pdf({
            format: "Letter",
            width: '1920px',
            height: '1080px',
            pageRanges: '1-1',
            printBackground: true,
        });
        console.log("Pdf generado");
        yield browser.close();
        return pdf;
    }
    catch (error) {
        throw new Error(error.message);
    }
});
exports.createQR = (dataForQRcode, center_image, width, cwidth) => __awaiter(void 0, void 0, void 0, function* () {
    const canvas = createCanvas(width, width);
    qrcode_1.default.toCanvas(canvas, dataForQRcode, {
        errorCorrectionLevel: "M",
        margin: 1,
        color: {
            dark: "#000000",
            light: "#ffffff",
        },
    });
    const ctx = canvas.getContext("2d");
    const img = yield loadImage(center_image);
    const center = (width - cwidth) / 2;
    ctx.drawImage(img, center, center, cwidth, cwidth);
    return canvas.toDataURL("image/png");
});
function capitalize(data) {
    return data.toUpperCase();
}
exports.capitalize = capitalize;
function extractColDocumentData(data) {
    console.log(data);
    const dataArray = data.replace(/[^A-Za-z0-9+]+/g, ' ').split(' ');
    let indexMod = 0;
    let idNumber;
    let lastName1;
    // Is old document
    if (/[A-Z]/g.test(dataArray[3])) {
        indexMod = -1;
        const idString = dataArray[3].replace(/[A-Z]/g, '');
        idNumber = idString.substring(10, idString.length);
        lastName1 = capitalize(dataArray[3].replace(/[0-9]/g, ''));
    }
    else {
        idNumber = dataArray[4].replace(/[A-Z]/g, '');
        lastName1 = capitalize(dataArray[4].replace(/[0-9]/g, ''));
    }
    const lastName2 = capitalize(dataArray[5 + indexMod].replace(/\W/g, ''));
    const firstName1 = capitalize(dataArray[6 + indexMod].replace(/\W/g, ''));
    let middleName;
    if (!(/[0-9]/g.test(dataArray[7 + indexMod]))) {
        middleName = capitalize(dataArray[7 + indexMod]);
    }
    const extraData = dataArray[middleName ? 8 + indexMod : 7 + indexMod];
    const gender = extraData.includes('M') ? 'MASCULINO' : 'FEMENINO';
    const birthDate = moment_1.default(extraData.substr(2, 10), 'YYYYMMDD');
    const bloodType = extraData.substr(-2);
    return {
        idNumber,
        lastName1,
        lastName2,
        firstName1,
        middleName,
        gender,
        birthDate,
        bloodType,
        fullName: `${firstName1} ${middleName || ''} ${lastName1} ${lastName2 || ''}`,
    };
}
exports.extractColDocumentData = extractColDocumentData;
//# sourceMappingURL=global.js.map