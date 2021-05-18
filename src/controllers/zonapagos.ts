import cryptoRandomString from "crypto-random-string";
import Validator from "validatorjs";
import { dataConfigPago, dividirCodigoBarrasText, generarCodigoBarras, generarCodigoBarrasText, limpiarCampos } from "../helpers/pago";
import { Pago } from "../models/Pago";
import { consultarpagoMatricula } from "./matricula";
import fetch from "node-fetch";
import { actualizarPagoyDetalleNew, existePago, getConfigPeriodo, getPagoByID, guardarPagoyDetalle, updateDataPago } from "../provider/pago_provider";
import { getInfoEstudiante } from "./pago";
import * as moneda from 'currency-formatter';
import { generarHTMLPDF } from "../helpers/global";

export const inicioPagoMatricua = async (req: any, res: any) => {
  let body = req.body;

  try {
    let dataBody: any = req.body;
    let tDetallePago: any = [];
    let new_detalle:any = [];
    let id_pago: number = null;
    let resultSavePago: any = {};
    let isPagoOnline :boolean = false; //0 efectivo 1 pago en linea
    let responseDataZonaPagos:any = {};
    let str_url ="";

    let result: any = await consultarpagoMatricula(body.cod_matricula);
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
 
      resultSavePago = await actualizarPagoyDetalleNew(tPago,tDetallePago,id_pago);
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
    finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(0,-(finpago2.str_descripcion_pago.length - 70));

    let bodyZonapagos = dataConfigPago(finpago2);

    //INICAMOS EL PAGO CON ZONAPAGOS

    if(isPagoOnline){
       responseDataZonaPagos = await inicarPagoZonaPagos(bodyZonapagos);
    }else{
      let infoEstudiante = await getInfoEstudiante(matricula.cod_matricula);

     let infoPagoDB :any = {};
     infoPagoDB.general = infoEstudiante;
     infoPagoDB.total_a_pagar = moneda.unformat(moneda.format(result.total_a_pagar_int, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' });
     infoPagoDB.det_factura = detalle_factura;
     infoPagoDB.str_id_pago = codigoFactura;
     infoPagoDB.descuentos = descuentos;
     infoPagoDB.total_formateado = moneda.format(result.total_a_pagar_int, { locale: 'es-CO' }).replace('$', '').trim();



    let [codigo1] = await generarCodigoBarrasText(resultSavePago[0], result.total_a_pagar_int, infoEstudiante.fecha_fin_ordinaria);
      //acualizar codigo de barras en la base de datos y el json con la referencia
      let dataPagoUpdate = {
        'codigo_barras' : codigo1,
        'json_response' : JSON.stringify(infoPagoDB)
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
//   /page/GenerarPagoCodigoBarras
//=====================
export const generarPagoCodigoBarras = async (req: any, res: any) => {

  let codigo_barras = req.params.codigo;

  let [convenio415,referencia8020] = await dividirCodigoBarrasText(codigo_barras);
  let id_pago =  parseInt(referencia8020.substr(3))
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
    console.log(porcentaje_ex);

    let new_detalle = await quitarAumentoDetalle(jsonDB.det_factura,0);
    console.log(new_detalle);

    let new_total_ordinario = await calculaTotalaPagar(new_detalle);

    let new_det2 = await quitarAumentoDetalle(jsonDB.det_factura,porcentaje_ex);

    let new_total_extraordianrio = await calculaTotalaPagar(new_det2);

    // es un pago en efectivo
   let [codigo1, svgText1] = await generarCodigoBarras(data._id, new_total_ordinario.toString(), general.fecha_fin_ordinaria);
   let [codigo2, svgText2] = await generarCodigoBarras(data._id, new_total_extraordianrio.toString(), general.fecha_fin_extraordinaria);


    general.codigo1 = svgText1;
    general.codigo2 = svgText2;
    general.det_factura =  await quitarAumentoDetalle(jsonDB.det_factura,0);
    general.referencia = data._id;
    general.total_ordi_formateado = moneda.format(new_total_ordinario, { locale: 'es-CO' }).replace('$', '').trim();
    general.total_extra_formateado = moneda.format(new_total_extraordianrio, { locale: 'es-CO' }).replace('$', '').trim();
    general.descuentos =  jsonDB.descuentos;
    general.BASE_URL = process.env.BASE_URL.toString();

    res.render("pdf_pago_matricula", general, async (err: any, html: any) => {
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


const calculaTotalaPagar = async (precios:any)=>{
  let total_a_pagar =  0;
  precios.forEach((element: any, index: number) => {
    total_a_pagar = element.subtotal + total_a_pagar;
  });

return total_a_pagar;
}

//esto solo puede funcionar si el aumento solo corresponde a la matricula extraordinaria
const quitarAumentoDetalle = async(detalle:any,newAumento:number) =>{
  let auxDetalle:any = [];
  detalle.forEach((row: any) => {
    let registro = row;
    registro.aumento = newAumento;

    let subtotal = (registro.valor_unidad * registro.cantidad);
    registro.subtotal = (subtotal + (subtotal * registro.aumento)) - (subtotal * registro.descuento);
    registro.descuento2 =  registro.descuento * 100;
    auxDetalle.push(registro);
  });




  return auxDetalle;
}


const inicarPagoZonaPagos = async (body:string) => {
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
  }else{
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

export const inicioPagoInscripcion = async (req: any, res: any) => {};
