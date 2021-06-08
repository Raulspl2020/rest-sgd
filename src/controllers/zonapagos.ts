import cryptoRandomString from "crypto-random-string";
import Validator from "validatorjs";
import { dataConfigPago, dividirCodigoBarrasText, generarCodigoBarras, generarCodigoBarrasText, limpiarCampos } from "../helpers/pago";
import { Pago } from "../models/Pago";
import { consultarpagoMatricula } from "./matricula";
import fetch from "node-fetch";
import { actualizarPagoyDetalleNew, existePago, getConfigPeriodo, getDescuento, getPagoByID, getPaquete, guardarPagoyDetalle, updateDataPago } from "../provider/pago_provider";
import { getInfoEstudiante } from "./pago";
import * as moneda from 'currency-formatter';
import { generarHTMLPDF } from "../helpers/global";
import { format } from "date-format-parse";
import { getFechasPeriodo, getInfoMatricula } from "../provider/matricula_provider";


//=================================
//   /transaccion/InicioPagoMatricula
//=================================
export const inicioPagoMatricula = async (req: any, res: any) => {
  let body = req.body;
  let fechaActualString = format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
  let fecha_limite_pago = new Date();
  fecha_limite_pago.setMonth(fecha_limite_pago.getMonth() + 12);

  try {
    let dataBody: any = req.body;
    let tDetallePago: any = [];
    let new_detalle: any = [];
    let id_pago: number = null;
    let resultSavePago: any = {};
    let isPagoOnline: boolean = (body.isPagoOnline != true) ? false : true;
    let responseDataZonaPagos: any = {};
    let str_url = "";

    let result: any = await consultarpagoMatricula(body.cod_matricula);

    console.log(result);

    let matricula = result.matricula;
    let detalle_factura = result.detalle_factura;
    let descuentos = result.descuentos;
    let cadenaCodigo =
      matricula.ide_persona +
      matricula.ape1_persona +
      matricula.ape2_persona +
      matricula.nom1_persona +
      matricula.nom2_persona;
    let codigoFactura = await generarCodigoFactura(cadenaCodigo.trim());

    //verificar si existe pago
    let resultExistePago = await existePago(
      detalle_factura[0].codigo,
      matricula.cod_matricula
    );

    let tPago: any = {
      codigo: codigoFactura,
      descripcion: detalle_factura[0].paquete,
      json_response: null,
      estado_id: 200,
      estudiante_id: matricula.ide_persona,
      matricula_id: matricula.cod_matricula,
      valor: result.total_a_pagar_int,
      periodo_id: matricula.cod_periodo,
      cod_paquete: detalle_factura[0].codigo,
      categoria_pago_id: detalle_factura[0].categoria_id,
    };

    if (resultExistePago == false) {
      //crear un nuevo pago
      detalle_factura.forEach((concepto: any) => {
        tDetallePago.push({
          pago_id: id_pago, // si se envia el id se lo asigna
          concepto_id: concepto.concepto_id,
          descuento: concepto.descuento,
          aumento: concepto.aumento,
          valor_unidad: concepto.valor_unidad,
          cantidad: concepto.cantidad,
        });
      });

      //preparamos la data para guardar
      resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);
      //si se guardó exitosamente
      if (resultSavePago != false) {
        id_pago = resultSavePago[0];
      } else {
        throw new Error("No se ha podido guardar el pago");
      }
    } else {
      //retomar y actualizar el pago en base de datos
      id_pago = resultExistePago._id;

      detalle_factura.forEach((concepto: any) => {
        tDetallePago.push({
          pago_id: id_pago, // si se envia el id se lo asigna
          concepto_id: concepto.concepto_id,
          descuento: concepto.descuento,
          aumento: concepto.aumento,
          valor_unidad: concepto.valor_unidad,
          cantidad: concepto.cantidad,
        });
      });

      resultSavePago = await actualizarPagoyDetalleNew(tPago, tDetallePago, id_pago);
      if (resultSavePago != false) {
        id_pago = resultSavePago[0];
      } else {
        throw new Error("No se ha podido guardar el pago");
      }




    }

    //preparamos los datos para enviar a zonapagos
    let infoPago = new Pago({
      flt_total_con_iva: result.total_a_pagar_int,
      flt_valor_iva: 0,
      str_id_pago: codigoFactura,
      str_descripcion_pago: detalle_factura[0].paquete,
      str_email: matricula.email_persona,
      str_id_cliente: matricula.ide_persona,
      str_tipo_id: matricula.cod_doc,
      str_nombre_cliente: matricula.nom1_persona + " " + matricula.nom2_persona,
      str_apellido_cliente:
        matricula.ape1_persona + " " + matricula.ape2_persona,
      str_telefono_cliente: matricula.cel_persona,
      str_opcional1: detalle_factura[0].codigo, //codigo paquete
      str_opcional2: "", //valor en letras
      str_opcional3: matricula.cod_matricula, //matricula
      str_opcional4: matricula.cod_periodo, //periodo
      str_opcional5: "",
    });

    //recortamos el tamaño de la descripcion
    let finpago2: Pago = new Pago(infoPago);
    finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(0, -(finpago2.str_descripcion_pago.length - 70));

    let bodyZonapagos = dataConfigPago(finpago2);

    //INICAMOS EL PAGO CON ZONAPAGOS

    if (isPagoOnline) {
      responseDataZonaPagos = await inicarPagoZonaPagos(bodyZonapagos);
    } else {
     // let infoEstudiante = await getInfoEstudiante(matricula.cod_matricula);

    
      let resultM = await getInfoMatricula(matricula.cod_matricula);
      let resultDB = resultM[0][0];

      let periodoInfo = await getFechasPeriodo(resultDB.cod_colegio,resultDB.cod_periodo );
      console.log(periodoInfo);
      if(periodoInfo==false){
        throw new Error("No se encontró periodo y sede configurados");
      }

      let infoPagoDB: any = {};
      infoPagoDB.general  = {
        fecha_actual: fechaActualString,
        fecha_fin_ordinaria : format(periodoInfo.fec_fin_matordinaria, 'DD-MM-YYYY') ,
        fecha_fin_extraordinaria: format(periodoInfo.fec_fin_matextraord, 'DD-MM-YYYY') ,
        fecha_fin_ins_nuevos: format(periodoInfo.fec_fin_ins_nuevos, 'DD-MM-YYYY') , 
        fecha_limite_pago: format(fecha_limite_pago, 'DD-MM-YYYY'),  
      };
      infoPagoDB.info_cliente = resultDB;
      infoPagoDB.det_factura = detalle_factura;
      infoPagoDB.cod_pago = codigoFactura;
      infoPagoDB.descuentos = descuentos;
      infoPagoDB.total_a_pagar_s = moneda.format(result.total_a_pagar_int, { locale: 'es-CO' }).replace('$', '').trim();
      infoPagoDB.total_a_pagar_i = moneda.unformat(moneda.format(result.total_a_pagar_int, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' });
      
      let [codigo1] = await generarCodigoBarrasText(resultSavePago[0], result.total_a_pagar_int, format(periodoInfo.fec_fin_matordinaria, 'DD-MM-YYYY'));
      //acualizar codigo de barras en la base de datos y el json con la referencia
      let dataPagoUpdate = {
        'codigo_barras': codigo1,
        'json_response': JSON.stringify(infoPagoDB)
      };
      console.log("hasta aqui todo bien");
      let respDB = await updateDataPago(dataPagoUpdate, resultSavePago[0]);
      str_url = process.env.BASE_URL + '/transaccion/GenerarPagoCodigoBarras/' + codigo1;
      responseDataZonaPagos = {
        "int_codigo": 1,
        "str_cod_error": "",
        "str_descripcion_error": "",
        "str_url": str_url,
      }
    }

    //si todo esta bien, procedemos a guardar
    return res.status(200).json({
      statusCode: 200,
      message: "Ejecucion correcta",
      error: false,
      pago_id: id_pago,
      data: responseDataZonaPagos,
      new_detalle
    });


  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};



//====================
//   /transaccion/GenerarPagoCodigoBarras
//=====================
export const generarPagoCodigoBarras = async (req: any, res: any) => {

  let codigo_barras = req.params.codigo;

  let [convenio415, referencia8020] = await dividirCodigoBarrasText(codigo_barras);
  let id_pago = parseInt(referencia8020.substr(3))
  let data: any = await getPagoByID(id_pago);
  console.log("aqui va el id_pago");
  console.log(id_pago);

  try {

    if (data == false) {
      throw new Error("No se encontró la matricula");
    }

    let jsonDB = JSON.parse(data.json_response);
    let general = jsonDB.general;

    let resultConfig = await getConfigPeriodo();
    let porcentaje_ex = (resultConfig.porcentaje_ext) ? resultConfig.porcentaje_ext : 0.1;
    let new_detalle = await quitarAumentoDetalle(jsonDB.det_factura, 0);
    let new_total_ordinario = await calculaTotalaPagar(new_detalle);
    let new_det2 = await quitarAumentoDetalle(jsonDB.det_factura, porcentaje_ex);
    let new_total_extraordianrio = await calculaTotalaPagar(new_det2);

    // es un pago en efectivo
    let [codigo1, svgText1] = await generarCodigoBarras(data._id, new_total_ordinario.toString(), general.fecha_fin_ordinaria);
    let [codigo2, svgText2] = await generarCodigoBarras(data._id, new_total_extraordianrio.toString(), general.fecha_fin_extraordinaria);
    let [codigo3, svgText3] = await generarCodigoBarras(data._id, jsonDB.total_a_pagar_i.toString(), general.fecha_fin_ins_nuevos);
    let [codigo4, svgText4] = await generarCodigoBarras(data._id, jsonDB.total_a_pagar_i.toString(), general.fecha_limite_pago);


    general.codigo1 = svgText1;
    general.codigo2 = svgText2;
    general.codigo3 = svgText3;
    general.codigo4 = svgText4;
    general.matricula =  jsonDB.info_cliente;
    general.det_factura = await quitarAumentoDetalle(jsonDB.det_factura, 0);
    general.referencia = data._id;
    general.total_ordi_formateado = moneda.format(new_total_ordinario, { locale: 'es-CO' }).replace('$', '').trim();
    general.total_extra_formateado = moneda.format(new_total_extraordianrio, { locale: 'es-CO' }).replace('$', '').trim();
    general.total_formateado = jsonDB.total_a_pagar_s
    general.descuentos = jsonDB.descuentos;
    general.BASE_URL = process.env.BASE_URL.toString();


    let vista_pago = "pdf_pago_general";

    switch (jsonDB.det_factura[0].categoria_id) {
      case 5:
        //paquete de inscripcion
        vista_pago = "pdf_pago_inscripcion";
        break;
      case 1:
        vista_pago = "pdf_pago_matricula";
        break;
      case 0:
        vista_pago = "pago_general";
        break;
      default:
        vista_pago = "pago_general";
        break;

    }


    res.render(vista_pago, general, async (err: any, html: any) => {
      let pdf = await generarHTMLPDF(html);
      res.contentType("application/pdf");
      res.send(pdf);
    });

  } catch (error) {
    console.log("Error algo paso");
    res.status(500).json({
      error: true,
      message: "El servicio no esta disponible " + error.message,
    });
  }
};




//====================
//   /page/GenerarPagoCodigoBarrasGeneral
//=====================
export const generarPagoCodigoBarrasGeneral = async (req: any, res: any) => {

  let codigo_barras = req.params.codigo;

  let [convenio415, referencia8020] = await dividirCodigoBarrasText(codigo_barras);
  let id_pago = parseInt(referencia8020.substr(3))
  let data: any = await getPagoByID(id_pago);
  console.log("aqui va el id_pago");


  try {

    if (data == false) {
      throw new Error("No se encontró la matricula");
    }

    let jsonDB = JSON.parse(data.json_response);
    let general = jsonDB.general;


    // es un pago en efectivo
    let [codigo, svgText] = await generarCodigoBarras(data._id, jsonDB.total_a_pagar.toString(), jsonDB.fecha_limite_pago);

    general.codigo = svgText;
    general.referencia = data._id;
    general.fecha_actual =  jsonDB.fecha_actual;
    general.det_factura =  jsonDB.det_factura;
    general.des_pago =  data.descripcion;
    general.total_a_pagar = moneda.format(jsonDB.total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim();
    general.BASE_URL = process.env.BASE_URL.toString();

    console.log(general);

 

    res.render("pdf_pago_general", general, async (err: any, html: any) => {
      let pdf = await generarHTMLPDF(html);
      res.contentType("application/pdf");
      res.send(pdf);
    });

  } catch (error) {
    console.log("Error algo paso");
    res.status(500).json({
      error: true,
      message: "El servicio no esta disponible " + error.message,
    });
  }
};


const calculaTotalaPagar = async (precios: any) => {
  let total_a_pagar = 0;
  precios.forEach((element: any, index: number) => {
    total_a_pagar = element.subtotal + total_a_pagar;
  });

  return Math.round(total_a_pagar);
}

//esto solo puede funcionar si el aumento solo corresponde a la matricula extraordinaria
const quitarAumentoDetalle = async (detalle: any, newAumento: number) => {
  let auxDetalle: any = [];
  detalle.forEach((row: any) => {
    let registro = row;
    registro.aumento = newAumento;

    let subtotal = (registro.valor_unidad * registro.cantidad);
    registro.subtotal = (subtotal + (subtotal * registro.aumento)) - (subtotal * registro.descuento);
    registro.descuento2 = registro.descuento * 100;
    auxDetalle.push(registro);
  });

  return auxDetalle;
}


const inicarPagoZonaPagos = async (body: string) => {
  //INICAMOS EL PAGO CON ZONAPAGOS
  let responseZona = await fetch(process.env.ZONAPAGOS_URL + "/InicioPago", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  let responseData = await responseZona.json();
  //si el int_codigo es igual a 1 todo salio bien
  if (responseData.int_codigo != 1) {
    throw new Error("Parámetros enviados de forma incorrecta");
  } else {
    return responseData;
  }
};


const generarCodigoFactura = async (cadena: string) => {
  let codigoFactura = "";
  cadena = limpiarCampos(cadena.replace(/\s+/g, ""));
  let validation;
  let contador = 0;
  let pagoMat: any = null;
  //si el codigo no es afanumerico se genera otro
  do {
    let codigo = await cryptoRandomString({
      length: 10,
      characters: cadena,
    });

    let regla = {
      cadena: "present|alpha_num",
    };

    let campos = {
      cadena: codigo,
    };
    validation = new Validator(campos, regla);
    codigoFactura = codigo;
    contador++;

    if (contador > 1000) {
      throw new Error("No se ha podido generar el codigo");
    }
  } while (validation.fails());

  return codigoFactura;
};





//====================
//   /page/InicioPagoInscripcion
//=====================
export const inicioPagoInscripcion = async (req: any, res: any) => {

  let body = req.body;
  let id_matricula = body.cod_matricula;
  let fechaActualString = format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
  let descuentos:any = [];
  let tDetallePago: any = [];
  let resultSavePago: any = {};
  let isPagoOnline: boolean = (body.isPagoOnline != true) ? false : true;
  let responseDataZonaPagos: any = {};
  let str_url = "";

  let id_pago = req.body.id_pago;  

  let fecha_limite_pago = new Date();
  fecha_limite_pago.setMonth(fecha_limite_pago.getMonth() + 12);


  try {
    let resultMatricula = await consultarDatosInscripcion(id_matricula);
    if (!resultMatricula) {
      throw new Error("no se ha podido consultar la informacion solicitada");
    }

    let conceptos = resultMatricula.det_factura;
    let matricula =  resultMatricula.info_cliente;

    let cadenaCodigo =
      matricula.ide_persona +
      matricula.ape1_persona +
      matricula.ape2_persona +
      matricula.nom1_persona +
      matricula.nom2_persona;
    let codigoFactura = await generarCodigoFactura(cadenaCodigo.trim());


    conceptos.forEach((concepto: any) => {
      tDetallePago.push({
        pago_id:(id_pago) ? id_pago : null, // si se envia el id se lo asigna
        concepto_id: concepto.concepto_id,
        descuento: concepto.descuento,
        aumento: concepto.aumento,
        valor_unidad: concepto.valor_unidad,
        cantidad: concepto.cantidad,
      });
    });

       //preparamos la data para guardar
       let tPago: any = {
        codigo: codigoFactura,
        descripcion: conceptos[0].paquete,
        json_response: JSON.stringify(resultMatricula),
        estado_id: 200,
        estudiante_id: matricula.ide_persona,
        matricula_id: matricula.cod_matricula,
        valor: resultMatricula.total_a_pagar_i,
        periodo_id: matricula.cod_periodo,
        cod_paquete: conceptos[0].codigo,
        categoria_pago_id: conceptos[0].categoria_id,
      };


          //validar si se envia el codigo de pago, se debe actualiar
        if(id_pago){
          resultSavePago = await actualizarPagoyDetalleNew(tPago, tDetallePago, id_pago);
        }else{
          //guardar el detalle de la factura
          resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);
        }

        //preparamos los datos para enviar a zonapagos
        let infoPago = new Pago({
          flt_total_con_iva: resultMatricula.total_a_pagar_i,
          flt_valor_iva: 0,
          str_id_pago: codigoFactura,
          str_descripcion_pago: conceptos[0].paquete,
          str_email: matricula.email_persona,
          str_id_cliente: matricula.ide_persona,
          str_tipo_id: matricula.cod_doc,
          str_nombre_cliente: matricula.nom1_persona + " " + matricula.nom2_persona,
          str_apellido_cliente: matricula.ape1_persona + " " + matricula.ape2_persona,
          str_telefono_cliente: matricula.cel_persona,
          str_opcional1: conceptos[0].codigo, //codigo paquete
          str_opcional2: "", //valor en letras
          str_opcional3: matricula.cod_matricula, //matricula
          str_opcional4: matricula.cod_periodo, //periodo
          str_opcional5: "",
        });
    
        //recortamos el tamaño de la descripcion
        let finpago2: Pago = new Pago(infoPago);
        finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(0, -(finpago2.str_descripcion_pago.length - 70));
    
        let bodyZonapagos = dataConfigPago(finpago2);
    




    if (isPagoOnline) {
      responseDataZonaPagos = await inicarPagoZonaPagos(bodyZonapagos);
    } else {
      let [codigo1] = await generarCodigoBarrasText(resultSavePago[0], resultMatricula.total_a_pagar_i, resultMatricula.general.fecha_fin_ordinaria);
      //acualizar codigo de barras en la base de datos y el json con la referencia
      let dataPagoUpdate = {
        'codigo_barras': codigo1,
        'json_response': JSON.stringify(resultMatricula)
      };
      let respDB = await updateDataPago(dataPagoUpdate, resultSavePago[0]);
      str_url = process.env.BASE_URL + '/transaccion/GenerarPagoCodigoBarras/' + codigo1;
      responseDataZonaPagos = {
        "int_codigo": 1,
        "str_cod_error": "",
        "str_descripcion_error": "",
        "str_url": str_url,
      }

    }

    return res.status(200).json({
      statusCode: 200,
      message: "Ejecucion correcta",
      error: false,
      pago_id: id_pago,
      data: responseDataZonaPagos
    });
} catch (error) {
    return res.status(500).json({
        error: true,
        message: error.message
    });
}


};


//===================================
//   /transaccion/InicioPagoGeneral
//====================================
export const inicioPagoGeneral = async (req: any, res: any) => {

  let fechaActual = new Date();
  fechaActual.setMonth(fechaActual.getMonth() + 12);
  let fechaLimitepago = format(fechaActual, 'YYYY-MM-DD');

  let body = req.body;
  let responseDataZonaPagos: any = {};
  let isPagoOnline: boolean = (body.isPagoOnline != true) ? false : true;
  let resultSavePago: any = {};
  let tDetallePago: any = [];
  let id_pago: number = null;
  let str_url = "";

  try {

    let cadenaCodigo = body.nombres + body.apellidos + body.id_cliente;
    let codigoFactura = await generarCodigoFactura(cadenaCodigo.toUpperCase().trim());

    let resultPaquete = await getPaquete(0);

    if (resultPaquete == false) {
      throw new Error("No se encontraron paquetes configurados");
    }


    //preparamos los datos para enviar a zonapagos
    let infoPago = new Pago({
      flt_total_con_iva: parseInt(body.total),
      flt_valor_iva: 0,
      str_id_pago: codigoFactura,
      str_descripcion_pago: body.des_concepto,
      str_email: body.email_persona,
      str_id_cliente: body.id_persona,
      str_tipo_id: body.tipo_id,
      str_nombre_cliente: body.nombres,
      str_apellido_cliente: body.apellidos,
      str_telefono_cliente: body.cel_persona,
      str_opcional1: "0", //codigo paquete
      str_opcional2: "", //valor en letras
      str_opcional3: "", //matricula
      str_opcional4: "", //periodo
      str_opcional5: "",
    });

    //recortamos el tamaño de la descripcion
    let finpago2: Pago = new Pago(infoPago);
    finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(0, -(finpago2.str_descripcion_pago.length - 70));

    let bodyZonapagos = dataConfigPago(finpago2);

    //GUARDAR EL PAGO EN LA DB
    let tPago: any = {
      codigo: codigoFactura,
      descripcion:  body.des_concepto,
      json_response: null,
      estado_id: 200,
      estudiante_id: body.ide_persona,
      // matricula_id: matricula.cod_matricula,
      valor: body.total,
      // periodo_id: matricula.cod_periodo,
      cod_paquete: resultPaquete[0].codigo,
      categoria_pago_id: resultPaquete[0].categoria_id,
    };


    //crear un nuevo pago
    resultPaquete.forEach((concepto: any) => {
      tDetallePago.push({
        pago_id: null, // si se envia el id se lo asigna
        concepto_id: concepto.concepto_id,
        descuento: concepto.descuento,
        aumento: concepto.aumento,
        valor_unidad: concepto.valor_unidad + body.total,
        cantidad: concepto.cantidad,
      });
    });

    //preparamos la data para guardar
    resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);
    console.log(resultSavePago);
    //   no se guardó exitosamente
    if (resultSavePago == false) {
      throw new Error("No se ha podido guardar el pago");
    }
    id_pago = resultSavePago[0];

    //INICAMOS EL PAGO CON ZONAPAGOS
    if (isPagoOnline) {
      responseDataZonaPagos = await inicarPagoZonaPagos(bodyZonapagos);
    } else {

      //llenamos el idpago al detalle
      resultPaquete.forEach((det: any) => (det.valor_unidad = parseInt(body.total)));

      let json_detalle = {
        "general": body,
        "total_a_pagar": body.total,
        "total_formateado": moneda.format(body.total, { locale: 'es-CO' }).replace('$', '').trim(),
        "fecha_limite_pago": fechaLimitepago,
        "fecha_actual":  format(new Date(), 'DD-MM-YYYY hh:mm:ss A'),
        'det_factura': resultPaquete
      };

      let [codigo1] = await generarCodigoBarrasText(resultSavePago[0], body.total, fechaLimitepago);
      //acualizar codigo de barras en la base de datos y el json con la referencia
      let dataPagoUpdate = {
        'codigo_barras': codigo1,
        'json_response': JSON.stringify(json_detalle)
      };
      let respDB = await updateDataPago(dataPagoUpdate, resultSavePago[0]);
      str_url = process.env.BASE_URL + '/transaccion/GenerarPagoCodigoBarrasGeneral/' + codigo1;
      responseDataZonaPagos = {
        "int_codigo": 1,
        "str_cod_error": "",
        "str_descripcion_error": "",
        "str_url": str_url,
      }

    }

    return res.status(200).json({
      statusCode: 200,
      message: "Ejecucion correcta",
      error: false,
      pago_id: id_pago,
      data: responseDataZonaPagos
    });


  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: true,
      message: "El servicio no esta disponible: " + error.message,
    });
  }
};



//consulta datos para pago inscripcion
export const consultarDatosInscripcion = async (id_matricula:any) => {
let resultDB: any;
  let resultPaquete: any;
  let total = 0;
  let total_a_pagar = 0;
  let total_sin_descuento = 0;
  let porcentaje_descuento = 0;
  let porcentaje_aumento = 0;
  let auxDescripcion = "";
  let fechaActualString = format(new Date(), 'DD-MM-YYYY hh:mm:ss A');
  let descuentos:any = [];

  let fecha_limite_pago = new Date();
  fecha_limite_pago.setMonth(fecha_limite_pago.getMonth() + 12);


  try {
    let result = await getInfoMatricula(id_matricula);

    resultDB = result[0][0];


    if (result[0].length > 0) {
        resultPaquete = await getPaquete(6);
        if (resultPaquete.length < 1) {
            throw new Error("No se encontraron precios configurados");
        }
        //consular los descuentos y multas que un estudiante tiene asignados
        let resultDto = await getDescuento(resultDB.cod_matricula, resultDB.cod_periodo);
        console.log(resultDto);

   

        resultDto.forEach((row: any) => {
            //si aplica descuento sino aplica aumento, si es 1 añade un descuento

            //si se puede aplicar a todos los tipos de concepto. Trae los descuentos segun el tipo
            if(row.tipo=='1'){
              descuentos.push(row);
                if (row.accion == 1) {
                  porcentaje_descuento = porcentaje_descuento + row.porcentaje;
                  auxDescripcion = auxDescripcion + " + DESCUENTO " + (row.porcentaje * 100) + "% " + row.observacion
              } else {
                  porcentaje_aumento = porcentaje_aumento + row.porcentaje;
                  auxDescripcion = auxDescripcion + " + AUMENTO " + (row.porcentaje * 100) + "% " + row.observacion
              }
            }

        });

      

        //agregar descuentos y aumentos encontrados
        resultPaquete.forEach((element: any, index: number) => {
          if(element.descuento_ext =='1'){
            console.log(porcentaje_descuento);
            element.descuento = porcentaje_descuento;
            element.aumento = porcentaje_aumento;

            let subTotal =  (element.valor_unidad * element.cantidad ) + ((element.valor_unidad * element.cantidad )  * element.aumento) - ((element.valor_unidad * element.cantidad )  * element.descuento);
            element.subtotal =  subTotal;

            total_a_pagar = total_a_pagar + subTotal;


          }


        });


    } else {
        throw new Error("No se encontró la inscripción");
    }


    let estadoPago =  await existePago('6',id_matricula);

    let periodoInfo = await getFechasPeriodo(resultDB.cod_colegio,resultDB.cod_periodo );
    if(periodoInfo==false){
      throw new Error("No se encontró periodo y sede configurados");
    }
    


    let arrayDB:any = {};

    arrayDB.general = {
      fecha_actual: fechaActualString,
      fecha_fin_ordinaria : format(periodoInfo.fec_fin_matordinaria, 'DD-MM-YYYY') ,
      fecha_fin_extraordinaria: format(periodoInfo.fec_fin_matextraord, 'DD-MM-YYYY') ,
      fecha_fin_ins_nuevos: format(periodoInfo.fec_fin_ins_nuevos, 'DD-MM-YYYY') , 
      fecha_limite_pago: format(fecha_limite_pago, 'DD-MM-YYYY'),  
    };
    arrayDB.info_cliente = resultDB;
    arrayDB.det_factura =resultPaquete;
    arrayDB.descuentos = descuentos
    arrayDB.cod_pago = "",
    arrayDB.total_a_pagar_s = moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim();
    arrayDB.total_a_pagar_i =  Math.round(total_a_pagar);

    return arrayDB;

  } catch (error) {
    throw new Error(error.message);
  }
  

  }


