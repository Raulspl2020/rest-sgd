import { response } from "express";
import { getInfoPago, getInfoFactura } from "../provider/pago_provider";

import JsBarcode from "jsbarcode";

import { DOMImplementation, XMLSerializer } from "xmldom";

const puppeteer =  require('puppeteer');

//====================
//   /pago/generarpagoinscripcion
//=====================
export const getInfoPagoFactura = async (req: any, res: any) => {
  let body = req.body;
  let codigoPago = req.params.cod_pago.trim();
  try {
    let infopago = await getInfoPago(codigoPago);
    let infopagoFactuta = await getInfoFactura(codigoPago);
    return res.status(200).json({
      error: true,
      message: "info pago",
      infopago,
      infopagoFactuta,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

//====================
//   /page/GenerarPagoCodigoBarras
//=====================
export const generarPagoCodigoBarras = async (req: any, res: any) => {
  let svgText = await generarCodigoBarras("2343", "", "");
  let data: any = {};
  data.BASE_URL = process.env.BASE_URL.toString();
  data.codigo = svgText.toString();

  try {
    let codigo = req.params.codigo;
    res.render("pdf_pago_inscripcion", data, async (err: any, html: any) => {
      try {

        const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setContent(html);
        const pdf = await page.pdf({
          format: 'Letter',
          printBackground: true,

        });
        console.log(pdf);
        console.log("Done");
        await browser.close();
        res.contentType("application/pdf");
        res.send(pdf);

      } catch (error) {
        console.log("va a suceder otra vez");
        console.log(error);
        res.json({
          error: true,
          message: "El servicio no esta disponible"

        });
      }
    });
  } catch (error) {
    console.log("Error algo paso");
    res.json({
      error: true,
      message: "El servicio no esta disponible"

    });
  }
};

export const generarCodigoBarras = async (
  referencia: any,
  valor: any,
  fecha: any
) => {
  const convenio415: string = "0000000025854";
  let referencia8020: string = "1124862618";
  let valor390n: string = "50000";
  const fecha96: string = "20210530";

  const length8020: number = 12;
  const length390n: number = 10;

  try {
    if (referencia8020.length < length8020) {
      let faltante = length8020 - referencia8020.length;
      for (let i = 0; i < faltante; i++) {
        referencia8020 = "0" + referencia8020;
      }
    } else if (referencia8020.length > length8020) {
      throw new Error("El codigo de referencia supera el máximo permitido");
    }

    if (valor390n.length < length390n) {
      let faltante = length390n - valor390n.length;
      for (let i = 0; i < faltante; i++) {
        valor390n = "0" + valor390n;
      }
    } else if (valor390n.length > length390n) {
      throw new Error("El valor supera el máximo permitido");
    }

    console.log(referencia8020);
    console.log(valor390n);

    let codigoBarras =
      "415" +
      convenio415 +
      "8020" +
      referencia8020 +
      "3900" +
      valor390n +
      "96" +
      fecha96;
    let text =
      "(415)" +
      convenio415 +
      "(8020)" +
      referencia8020 +
      "(3900)" +
      valor390n +
      "(96)" +
      fecha96;

    const xmlSerializer = new XMLSerializer();
    const document = new DOMImplementation().createDocument(
      "http://www.w3.org/1999/xhtml",
      "html",
      null
    );
    const svgNode = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

    JsBarcode(svgNode, codigoBarras, {
      xmlDocument: document,
      height: 50,
      width: 1,
      fontSize: 8,
      text: text,
      margin: 3,
    });

    const svgText = xmlSerializer.serializeToString(svgNode);

    return svgText;
  } catch (error) { }
};
