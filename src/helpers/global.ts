const puppeteer = require("puppeteer");
const { createCanvas, loadImage } = require("canvas");
import QRCode from 'qrcode';

export const convertTo24Hour = (time: string) => {

    let hours = parseInt(time.substr(0, 2));
    if (time.indexOf('AM') != -1 && hours == 12) {
        time = time.replace('12', '0');
    }
    if (time.indexOf('PM') != -1 && hours < 12) {
        time = time.replace(hours.toString(), (hours + 12).toString());
    }
    return time.replace(/(AM|PM)/, '');
}

export const generarHTMLPDF = async (html: string) => {
    try {
        const browser = await puppeteer.launch({
            args: [
                "--no-sandbox",
                "--headless",
                "--disable-gpu",
                "--disable-setuid-sandbox",
            ],
        });
        const page = await browser.newPage();

        await page.setContent(html);
        const pdf = await page.pdf({
            format: "Letter",
            printBackground: true,
        });
        console.log("Pdf generado");
        await browser.close();

        return pdf;



    } catch (error) {
        throw new Error(error.message);
    }

}

export const generarHTMLPDFNew = async (html: string) => {
    try {
        const browser = await puppeteer.launch({
            args: [
                "--no-sandbox",
                "--headless",
                "--disable-gpu",
                '--start-maximized',
                "--disable-setuid-sandbox",
            ]
        });
        const page = await browser.newPage();



        await page.setContent(html);
        const pdf = await page.pdf({
            format: "Letter",
            width: '1920px',
             height: '1080px',
            pageRanges: '1-1',
            printBackground: true,
        });
        console.log("Pdf generado");
        await browser.close();

        return pdf;



    } catch (error) {
        throw new Error(error.message);
    }

}


export const createQR = async (dataForQRcode:string, center_image:string, width:number, cwidth:number)=> {
    const canvas = createCanvas(width, width);
    QRCode.toCanvas(
      canvas,
      dataForQRcode,
      {
        errorCorrectionLevel: "M",
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }
    );
  
    const ctx = canvas.getContext("2d");
    const img = await loadImage(center_image);
    const center = (width - cwidth) / 2;
    ctx.drawImage(img, center, center, cwidth, cwidth);
    return canvas.toDataURL("image/png");
  }