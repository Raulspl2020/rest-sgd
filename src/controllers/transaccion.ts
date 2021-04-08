import { response } from "express";
import cryptoRandomString from "crypto-random-string";
import { v4 as uuidv4 } from 'uuid';
import { Pago } from "../models/Pago";
import fetch from "node-fetch";
import { dataConfigPago, limpiarCampos } from "../helpers/pago";
import  { ListResponsePago } from "../models/ResponsePago";
import { parse,format  } from 'date-format-parse';
import { consultarpagoMatricula } from "../controllers/matricula";
import {
  guardarPago,
  guardarPagoyDetalle,
  getConceptosPaquete,
  actualizarEstadoPago,
  actualizarPagoyDetalle,
  detIdPagoByCodigo
} from "../provider/pago_provider";
let Validator = require("validatorjs");

//====================
//   /transaccion/estado
//=====================
export const actualizarTransaccion = async (req: any, res = response) => {

  let codigo_pago = req.query.id_pago;

  const data = {
    int_id_comercio: process.env.ZONAPAGOS_ID,
    str_usr_comercio: process.env.ZONAPAGOS_USER,
    str_pwd_comercio: process.env.ZONAPAGOS_PASS,
    int_no_pago: -1,
    str_id_pago: codigo_pago
  };

  let fechaUpdate = new Date();

  try {
    let id_pago = await detIdPagoByCodigo(codigo_pago);


    console.log("inicia la consulta");
    let response = await fetch(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    let responseData = await response.json();

    if (responseData.int_error == 0) {
      const resss = new ListResponsePago();
      let pagoDecoded = resss.decodePagoToList(responseData.str_res_pago);

      let dataBody: any = pagoDecoded[0];
      if (id_pago == false) {
        //insertar el pago en la DB

        let infoPago = new Pago({
          flt_total_con_iva: dataBody.dbl_total_pago,
          flt_valor_iva: dataBody.dbl_valor_iva_pagado,
          str_id_pago: limpiarCampos(codigo_pago),
          str_descripcion_pago: limpiarCampos(dataBody.str_descripcion),
          str_email: dataBody.str_email,
          str_id_cliente: limpiarCampos(dataBody.str_id_cliente),
          str_tipo_id: limpiarCampos(dataBody.str_tipo_id),
          str_nombre_cliente: limpiarCampos(dataBody.str_nombre_cliente),
          str_apellido_cliente: limpiarCampos(dataBody.str_apellido_cliente),
          str_telefono_cliente: limpiarCampos(dataBody.str_telefono_cliente),
          str_opcional1: limpiarCampos(dataBody.str_campo1), //codigo paquet)e
          str_opcional2: limpiarCampos(dataBody.str_campo2), //valor en letra)s
          str_opcional3: limpiarCampos(dataBody.str_campo3), //matricul)a
          str_opcional4: limpiarCampos(dataBody.str_campo4), //periodo
          str_opcional5: limpiarCampos(dataBody.str_campo5),
        });

        let resSavePago = await savePago(infoPago, null,null);

        id_pago = resSavePago.pago_id;

      }

      let data: any = {
        'json_detalle': responseData.str_res_pago,
        'estado_id': pagoDecoded[0].int_pago_terminado,
        'fecha_update': format(fechaUpdate,  'YYYY-MM-DD HH:mm:ss')
      };

      let detPago: any = [];
      pagoDecoded.forEach((det: any) => {

        detPago.push({
          '_id': uuidv4(),
          'pago_id': id_pago,
          'valor_pago': det.dbl_valor_pagado,
          'total_pago': det.dbl_total_pago,
          'valor_iva_pago': det.dbl_valor_iva_pagado,
          'estado_pago_id': (det.int_estado_pago=='') ? null: det.int_estado_pago ,
          'forma_pago_id': (det.int_id_forma_pago=='')? null : det.int_id_forma_pago,
          'nombre_banco': (det.str_nombre_banco=='') ? null : det.str_nombre_banco,
          'codigo_transaccion': (det.str_codigo_transacción=='') ? null : det.str_codigo_transacción,
          'fecha' : format(parse(det.dat_fecha, "DD/MM/YYYY h:mm:ss A"), 'YYYY-MM-DD HH:mm:ss'),
          'ticketID': (det.str_ticketID=='') ? null : det.str_ticketID,
          'numero_tarjeta': (det.int_numero_tarjeta=='') ? null : det.int_numero_tarjeta,
          'franquicia' : (det.str_franquicia=='') ? null : det.str_franquicia,
          'cod_aprobacion': (det.int_cod_aprobacion=='') ? null : det.int_cod_aprobacion,
          'num_recibido': (det.int_num_recibido=='') ? null : det.int_num_recibido
        });

      });

      //actualiza la fecha y el estado de un pago en la DB
      let resDB = await actualizarEstadoPago(data, codigo_pago);

      //borra y crea los detalles pago: true-false
      let resDb2 = await actualizarPagoyDetalle(id_pago, detPago);
      

      if (resDb2) {
        res.status(200).json({
          message: "Pago actualizado exitosamente",
          error: false,
          data: pagoDecoded,
          data_server: responseData.str_res_pago,
        });
      } else {
        throw new Error("No se ha podido insertar los detalle de pago");
      }
    } else {
      throw new Error("Error de comunicacion con zonapagos o código no encontrado");
    }


  } catch (error) {
    res.status(500).json({
      message: "Servicio no disponible temporalmente",
      error: true,
      det_error: error.message
    });
  }


};

//====================
//   /transaccion/VerificacionPago
//=====================
export const verificaPago = async (req: any, res = response) => {
  let body = req.body;
  const data = {
    int_id_comercio: process.env.ZONAPAGOS_ID,
    str_usr_comercio: process.env.ZONAPAGOS_USER,
    str_pwd_comercio: process.env.ZONAPAGOS_PASS,
    int_no_pago: -1,
    str_id_pago: body.str_id_pago,
  };

  fetch(process.env.ZONAPAGOS_URL + "/VerificacionPago", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.int_error == 0) {
        
        const resss = new ListResponsePago();
        let pagoDecoded = resss.decodePagoToList(response.str_res_pago);
        res.status(200).json({
          message: response.str_detalle,
          error: false,
          data: pagoDecoded,
          data_server: response.str_res_pago,
        });
      } else {
        res.status(200).json({
          message: response.str_detalle,
          error: true,
          data: response,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Algo salio mal",
        error: true,
        det_error: error,
      });
    });
};

//====================
//   /transaccion/InicioPago
//=====================
export const inicioPago = async (req: any, res = response) => {
  let dataBody: any = req.body;


  try {

    let infoPago = new Pago({
      flt_total_con_iva: dataBody.flt_total_con_iva,
      flt_valor_iva: dataBody.flt_valor_iva,
      str_id_pago: limpiarCampos(dataBody.str_id_pago),
      str_descripcion_pago: limpiarCampos(dataBody.str_descripcion_pago),
      str_email: dataBody.str_email,
      str_id_cliente: limpiarCampos(dataBody.str_id_cliente),
      str_tipo_id: limpiarCampos(dataBody.str_tipo_id),
      str_nombre_cliente: limpiarCampos(dataBody.str_nombre_cliente),
      str_apellido_cliente: limpiarCampos(dataBody.str_apellido_cliente),
      str_telefono_cliente: limpiarCampos(dataBody.str_telefono_cliente),
      str_opcional1: limpiarCampos(dataBody.str_opcional1), //codigo paquete
      str_opcional2: limpiarCampos(dataBody.str_opcional2), //valor en letras
      str_opcional3: limpiarCampos(dataBody.str_opcional3), //matricula
      str_opcional4: limpiarCampos(dataBody.str_opcional4), //periodo
      str_opcional5: limpiarCampos(dataBody.str_opcional5),
    });

    //si no se envia el codigo se crea un nuevo pago
    if (dataBody.str_id_pago == "") {
      //generamos el codigo
      let cadena =
        dataBody.str_nombre_cliente +
        dataBody.str_apellido_cliente +
        dataBody.str_id_cliente.trim();

      cadena = limpiarCampos(cadena.replace(/\s+/g, ""));
      let validation;
      let contador = 0;
      let pagoMat:any= null;
      //si el codigo no es afanumerico se genera otro
      do {

        let codigo = await cryptoRandomString({
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
        infoPago.str_id_pago = codigo;
        contador++;

        if (contador > 1000) {
          throw new Error("No se ha podido generar el codigo");

        }
      } while (validation.fails());

      //verificar si es un pago de matricula, si lo es consultar el valor a pagar
      let conceptos = await getConceptosPaquete(infoPago.str_opcional1);
      if(conceptos.length > 0 && conceptos[0].categoria_id==1 && infoPago.str_opcional3!="" ) {
        pagoMat = await consultarpagoMatricula(infoPago.str_opcional3);
        infoPago.flt_total_con_iva = pagoMat.total_a_pagar_int
        infoPago.str_opcional3 = pagoMat.matricula.cod_matricula;
        infoPago.str_opcional4 = pagoMat.matricula.cod_periodo;
      }
      

      //recortamos el tamaño de la descripcion
      let finpago2:Pago = new Pago(infoPago);
      finpago2.str_descripcion_pago = finpago2.str_descripcion_pago.slice(0,-(finpago2.str_descripcion_pago.length-70));

      
      let responseZona = await fetch(process.env.ZONAPAGOS_URL + "/InicioPago", {
        method: "POST",
        body: JSON.stringify(dataConfigPago(finpago2)),
        headers: { "Content-Type": "application/json" },
      });

      let responseData = await responseZona.json();


      if (responseData.int_codigo == 1) {

        let response = await savePago(infoPago, JSON.stringify(responseData),pagoMat);
        res.status(response.statusCode).json(response);

      } else {
        throw new Error("Parámetros enviados de forma incorrecta");
      }

    } else {
      let response = await updatePago(infoPago);
      res.status(response.statusCode).json(response);
    }


  } catch (error) {
    res.status(500).json({
      message: error.message,
      error: true,
      det_error: error.message,
    });
  }
};

//====================
//   guardarEL pago generado
//=====================
const savePago = async (infoPago: any, responseData: any,dataMatricula:any) => {
  console.log("ejecutamos la fucnion de save");

  //pendiente validar precios: si son diferentes mostrar alerta

  let ret: any = {};

  let paquete_id = infoPago.str_opcional1;
  let tDetallePago: any = [];

  try {

    //buscamos un paquete por codigo
    let conceptos = await getConceptosPaquete(paquete_id);

    if (conceptos.length > 0) {

      //si es un pago de matricula
      if(dataMatricula!==null){

        dataMatricula.detalle_factura.forEach((concepto: any) => {

          tDetallePago.push({
          pago_id: null,
          concepto_id: concepto.concepto_id,
          descuento: concepto.descuento,
          aumento: concepto.aumento,
          valor_unidad: concepto.valor_unidad,
          cantidad: concepto.cantidad,
          });
        });

      }else{

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

    }
    } else {
      throw new Error("No se encontro el paquete...");
    }


    let tPago: any = {
      codigo: infoPago.str_id_pago,
      descripcion: infoPago.str_descripcion_pago,
      json_response: responseData,
      estado_id: 200,
      estudiante_id: infoPago.str_id_cliente,
      matricula_id: (infoPago.str_opcional3 == "") ? null : infoPago.str_opcional3,
      valor: infoPago.flt_total_con_iva,
      valor_letras: infoPago.str_opcional2,
      periodo_id: (infoPago.str_opcional4 == "") ? null : infoPago.str_opcional4,
    //  archivo_id: null,
      categoria_pago_id: conceptos[0].categoria_id,
    };

    //guardar el detalle de la factura
    let resultSavePago = await guardarPagoyDetalle(tPago, tDetallePago);

    if (resultSavePago != false) {
      ret = {
        statusCode: 200,
        message: "Ejecucion correcta",
        error: false,
        pago_id: resultSavePago,
        data: JSON.parse(responseData),
      };

      return ret;
    } else {
      throw new Error("No se ha podido guardar el pago");
    }

  } catch (error) {
    ret = {
      statusCode: 500,
      message: error.message,
      error: true,
      det_error: error,
    };
    return ret;
  }
};

const updatePago = async (infoPago: any) => {
  console.log("ejecutamos la fucnion de update");
  let ret: any = {
    message: "Listo para actualizar",
    error: false,
    statusCode: 200,
  };
  return ret;
};
