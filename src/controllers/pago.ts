import { getInfoPago, getInfoFactura, getPaquete } from "../provider/pago_provider";
import { parse, format } from 'date-format-parse';

import JsBarcode from "jsbarcode";

import { DOMImplementation, XMLSerializer } from "xmldom";
import { getDatePeriodo, getInfoMatricula } from "../provider/matricula_provider";
import { generarHTMLPDF } from "../helpers/global";
import { limpiarCampos } from "../helpers/pago";
import cryptoRandomString from "crypto-random-string";

let Validator = require("validatorjs");


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
//   /transaccion/InicioPagoCodigoBarras
//=====================
export const InicioPagoCodigoBarras = async (req: any, res: any) => {

  //validar valores obligatorios
  let id_matricula = req.body.id_matricula;
  let id_paquete = req.body.id_paquete;
  let codigo: string = null;

  let infoPago: any = {};

  try {



    let resultDB = await getInfoEstudiante(id_matricula);
    console.log(resultDB);


    if (resultDB !== false) {


      //generamos el codigo
      let cadena =
        resultDB.matricula.ape1_persona +
        resultDB.matricula.ape2_persona +
        resultDB.matricula.nom1_persona +
        resultDB.matricula.nom2_persona +
        resultDB.matricula.ide_persona.trim();

      cadena = limpiarCampos(cadena.replace(/\s+/g, ""));
      let validation;
      let contador = 0;
      //si el codigo no es afanumerico se genera otro
      do {

        codigo = await cryptoRandomString({
          length: 10,
          characters: cadena,
        });

        let regla = {
          'cadena': 'present|alpha_num'
        };

        let campos = {
          'cadena': codigo
        };
        validation = new Validator(campos, regla);
        contador++;

        if (contador > 1000) {
          throw new Error("No se ha podido generar el codigo");

        }
      } while (validation.fails());


      //obtenemos el paquete a facturar
      let resultPaquete = await getPaquete(resultDB.matricula.cod_periodo, id_paquete);








      res.json({
        error: false,
        message: "Reuta lista",
        codigo,
        resultPaquete,
        resultDB
      });




    }

    res.json({
      error: false,
      message: "No se ecnuentra nada",
      resultDB
    });


  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message,

    });
  }






}





//====================
//   /page/GenerarPagoCodigoBarras
//=====================
export const generarPagoCodigoBarras = async (req: any, res: any) => {


  let svgText = await generarCodigoBarras("2343", "", "");
  let codigo_matricula = req.params.codigo;
  let data: any = await getInfoEstudiante(codigo_matricula);



  data.BASE_URL = process.env.BASE_URL.toString();
  data.codigo = svgText.toString();
  console.log(data);
  try {


    if (data == false) {
      throw new Error("No se encontró la matricula");
    }


    res.render("pdf_pago_inscripcion", data, async (err: any, html: any) => {
      let pdf = await generarHTMLPDF(html);
      res.contentType("application/pdf");
      res.send(pdf);
    });


  } catch (error) {
    console.log("Error algo paso");
    res.json({
      error: true,
      message: "El servicio no esta disponible " + error.message,
    });
  }
};



//obtiene la informacion necesaria para añador al pdf de codigo de barras
const getInfoEstudiante = async (id_matricula: string) => {

  try {
    let fechaActual = format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
    let data: any = {};
    let result = await getInfoMatricula(id_matricula);

    let resultDB = result[0][0];

    if (result[0].length > 0) {
      let periodo = await getDatePeriodo(resultDB.cod_colegio, resultDB.cod_periodo);
      data.fecha_actual = fechaActual;
      data.fecha_fin_ordinaria = format(periodo.fec_fin_matordinaria, 'DD-MM-YYYY');
      data.fecha_fin_extraordinaria = format(periodo.fec_fin_matextraord, 'DD-MM-YYYY')
      data.matricula = resultDB;
      return data;
    } else {
      return false;
    }

  } catch (error) {
    throw new Error("Error al ejecutar la consulta: " + error.message);
  }


}










export const generarCodigoBarras = async (referencia: any, valor: any, fecha: any) => {
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

    let codigoBarras = "415" + convenio415 + "8020" + referencia8020 + "3900" + valor390n + "96" + fecha96;
    let text = "(415)" + convenio415 + "(8020)" + referencia8020 + "(3900)" + valor390n + "(96)" + fecha96;

    const xmlSerializer = new XMLSerializer();
    const document = new DOMImplementation().createDocument("http://www.w3.org/1999/xhtml", "html", null);
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    JsBarcode(svgNode, codigoBarras, {
      xmlDocument: document,
      height: 50,
      width: 1.13,
      fontSize: 10,
      text: text,
      margin: 2,
    });

    const svgText = xmlSerializer.serializeToString(svgNode);

    return svgText;
  } catch (error) { }
};
