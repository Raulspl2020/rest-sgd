import { getInfoPago, getInfoFactura, getPaquete, getDescuento, getConfigPeriodo, guardarPagoyDetalle, getConceptosPaquete, updateCodigoBarras, getPagoByBarCOde, existePago } from "../provider/pago_provider";
import { parse, format } from 'date-format-parse';

import JsBarcode from "jsbarcode";

import { DOMImplementation, XMLSerializer } from "xmldom";
import { getDatePeriodo, getInfoMatricula } from "../provider/matricula_provider";
import { generarHTMLPDF } from "../helpers/global";
import { limpiarCampos } from "../helpers/pago";
import cryptoRandomString from "crypto-random-string";
import * as moneda from 'currency-formatter';

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



export const consultaDatosInscripcion = async (id_matricula: string, id_paquete: string) => {


  let codigo: string = null;
  let total = 0;
  let total_a_pagar = 0;
  let total_con_descuento = 0;
  let total_sin_descuento = 0;
  let porcentaje_descuento = 0;
  let porcentaje_aumento = 0;
  let descripcionFactura = "";
  let auxDescripcion = "";
  let precios: any;
  let periodo: any;

  let infoPago: any = {};

  try {



    let resultDB = await getInfoEstudiante(id_matricula);



    if (resultDB !== false) {
      let resultConfig = await getConfigPeriodo();

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
      let resultPaquete: any = null;


      //consular los descuentos y multas que un estudiante tiene asignados
      let resultDto = await getDescuento(resultDB.matricula.cod_matricula, resultDB.matricula.cod_periodo);

      console.log(resultDto);


      resultDto.forEach((row: any) => {
        //si aplica descuento sino aplica aumento, si es 1 añade un descuento
        if (row.accion == 1) {
          porcentaje_descuento = porcentaje_descuento + row.porcentaje;
          auxDescripcion = auxDescripcion + " + DESCUENTO " + (row.porcentaje * 100) + "% " + ((row.observacion) ? row.observacion : "");
        } else {
          porcentaje_aumento = porcentaje_aumento + row.porcentaje;
          auxDescripcion = auxDescripcion + " + AUMENTO " + (row.porcentaje * 100) + "% " + ((row.observacion) ? row.observacion : "");
        }
      });




      resultPaquete = await getPaquete(resultDB.matricula.cod_periodo, id_paquete);
      //validar si no se encuentra el paquete


      if (resultPaquete != false) {
        descripcionFactura = "" + resultPaquete[0].paquete + auxDescripcion





        precios = resultPaquete;




        precios.forEach((element: any, index: number) => {


          //si se puede aplicar descuento externo
          if (element.descuento_ext == '1') {

            console.log("Se va a aplicar descuento");


            let totaAPagar = 0;
            if (element.cantidad > 0) {
              totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
            } else {
              precios[index].cantidad = resultDB.nro_creditos;
              precios[index].descuento = porcentaje_descuento;
              precios[index].aumento = porcentaje_aumento + precios[index].aumento;
              porcentaje_descuento = 0;
              porcentaje_aumento = 0;
              total = element.subtotal * Number(resultDB.nro_creditos);
              totaAPagar = totaAPagar + total;
            }
            total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);

          } else {
            let totaAPagar = 0;
            if (element.cantidad > 0) {
              totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
            } else {
              total = element.subtotal * Number(resultDB.nro_creditos);
              totaAPagar = totaAPagar + total;
              precios[index].cantidad = resultDB.nro_creditos;
            }
            total_sin_descuento = totaAPagar;
          }


          //APLICA DESCUENTO A TODOS LOS CONCEPTOS SI ESTA CONFIGURADO
          resultDto.forEach((row: any) => {
            //si aplica descuento sino aplica aumento
            if (row.tipo == 1 && row.accion == 1) {
              precios[index].descuento = row.porcentaje;
            } else if (row.tipo == 1 && row.accion == 0) {
              precios[index].aumento = row.porcentaje;
            }

          });



          //calcula el total sin descuento
          if (element.cantidad > 0) {
            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
          } else {
            total = element.subtotal * Number(resultDB.nro_creditos);
            total_a_pagar = total_a_pagar + total;
          }
          total_sin_descuento = total_a_pagar;

        });

        //volvemos a recorrer para calcular totales
        total_a_pagar = 0;
        precios.forEach((element: any, index: number) => {
          precios[index].paquete = descripcionFactura;
          let subtotal = (element.valor_unidad * element.cantidad);
          precios[index].subtotal = (subtotal + (subtotal * element.aumento)) - (subtotal * element.descuento)
          total_a_pagar = element.subtotal + total_a_pagar;
        });

      } else {
        throw new Error("No se encontraron precios configurados");
      }





      infoPago.general = resultDB;
      infoPago.total_a_pagar = moneda.unformat(moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' });
      infoPago.det_factura = precios;
      infoPago.str_id_pago = codigo;
      infoPago.total_formateado = moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim();

      return infoPago;



    }


  } catch (error) {
    throw new Error(error.message);
  }


}


//====================
//   /transaccion/InicioPagoCodigoBarras
//=====================
export const InicioPagoCodigoBarras = async (req: any, res: any) => {

  //validar valores obligatorios
  let id_matricula = req.body.id_matricula;
  let id_paquete = req.body.id_paquete;
  let infoPago: any = {};
  let infoPago2: any = {};
  let tDetallePago: any = [];


  try {
    infoPago = await consultaDatosInscripcion(id_matricula, id_paquete);
    console.log(infoPago);

    if (!infoPago) {
      throw new Error("no se ha podido consultar la informacion solicitada");
    }
    infoPago2 = infoPago.general;



    //buscamos un paquete por codigo
    let conceptos = await getConceptosPaquete(id_paquete);

    if (conceptos.length > 0) {

      conceptos.forEach((concepto: any) => {
        tDetallePago.push({
          pago_id: null,
          concepto_id: concepto.concepto_id,
          descuento: concepto.descuento,
          aumento: concepto.aumento,
          valor_unidad:
            concepto.categoria_id == 0
              ? infoPago.flt_total_con_iva
              : concepto.valor_unidad,
          cantidad: concepto.cantidad,
        });
      });


      //preparamos la data para guardar
      let tPago: any = {
        codigo: infoPago.str_id_pago,
        descripcion: infoPago.det_factura[0].paquete,
        json_response: JSON.stringify(infoPago),
        estado_id: 200,
        estudiante_id: infoPago2.matricula.ide_persona,
        matricula_id: infoPago2.matricula.cod_matricula,
        valor: infoPago2.total_a_pagar,
        periodo_id: infoPago2.matricula.cod_periodo,
        cod_paquete: infoPago.det_factura[0].codigo,
        categoria_pago_id: conceptos[0].categoria_id,
      };

      //guardar el detalle de la factura
      let resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);
      infoPago.referencia = resultSavePago[0];
      if (resultSavePago != false) {
        //generamos codigo de barras

        let [codigo, svgText] = await generarCodigoBarras(resultSavePago[0], infoPago.total_a_pagar, infoPago2.fecha_fin_ordinaria);



        //acualizar codigo de barras en la base de datos y el json con la referencia
        let respDB = await updateCodigoBarras(codigo, resultSavePago[0]);

        console.log("repsuestaDB");
        console.log(respDB);

        res.json({
          error: false,
          pfd_url: process.env.BASE_URL + '/page/GenerarPagoCodigoBarras/' + codigo,
          message: "Pago generado con exito"
        });



      } else {
        throw new Error("no se encontraron los conceptos");
      }


    } else {
      throw new Error("No se encontro el paquete...");
    }

  } catch (error) {
    res.json({
      error: true,
      message: "El servicio no esta disponible " + error.message,
    });
  }

}





//====================
//   /page/GenerarPagoCodigoBarras
//=====================
export const generarPagoCodigoBarras = async (req: any, res: any) => {



  let codigo_matricula = req.params.codigo;


  let data: any = await getPagoByBarCOde(codigo_matricula);



  try {


    if (data == false) {
      throw new Error("No se encontró la matricula");
    }

    let jsonDB = JSON.parse(data.json_response);
    let general = jsonDB.general;
    let [codigo, svgText] = await generarCodigoBarras(data._id, jsonDB.total_a_pagar, general.fecha_fin_ordinaria);
    general.codigo = svgText;
    general.det_factura = jsonDB.det_factura;
    general.referencia = data._id;
    general.total_ordi_formateado = moneda.format(jsonDB.total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim();

    general.BASE_URL = process.env.BASE_URL.toString();


    res.render("pdf_pago_inscripcion", general, async (err: any, html: any) => {
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










export const generarCodigoBarras = async (referencia: string, valor: string, fecha: any) => {
  const convenio415: string = "0000000025854";
  let referencia8020: string = referencia.toString();

  let valor390n: string = valor.toString();
  let [dia, mes, año]: string = fecha.split('-');

  const fecha96: string = año + mes + dia;

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

    return [codigoBarras, svgText];
  } catch (error) {

  }
};



//====================
//   /transaccion/existepago
//=====================
export const existePagoDB = async (req: any, res: any) => {

  //validar que los campos sean obligatorios
  let body = req.body;

  try {

    let resultDB = await existePago(body.cod_paquete, body.cod_matricula);

    if (resultDB != false) {

      res.json({
        error: false,
        message: "Se ha encontrado un pago sin finalizar",
        ref_pago: resultDB._id,
      });
    } else {
      res.json({
        error: true,
        message: "No se encontraron pagos en esta matricula",
        ref_pago: null,
      });
    }




  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Ha ocurrido un error interno: "+  error.message,
      body
    });
  }





}