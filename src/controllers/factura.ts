import { parse, format } from "date-format-parse";
import { actualizarPagoyDetalle, consultaFacturaBanco, consultaFacturaCliente, consultaPagoFacturaCliente, consultarPagoFactura, existeDetPago, reversarPagoyDetalle } from "../provider/factura_provider";
import { v4 as uuidv4 } from 'uuid';
import { guardarLog } from "../provider/log_provider";
import { getConfigPeriodo, getDescuento, getDescuentoFactura, getFactura, getPagoFactura, updateEstadoDescuentoFac } from "../provider/pago_provider";
import { consultarpagoMatricula } from "./matricula";
import { getFechasPeriodo, getInfoMatricula } from "../provider/matricula_provider";
import { ejecutarZonaPagos } from "../helpers/pago";
import { ListResponsePago } from "../models/ResponsePago";
import { Verificadorpago } from "./zonapagos";
import * as moneda from 'currency-formatter';

//====================
//   /transaccion/consultaFactura
//=====================
export const consultaFacturaService = async (req: any, res: any) => {

  let body = req.body;

  //pendiente validar los pagos de metricula extraordinaria
  let fechaActual = new Date();
  fechaActual.setHours(0, 0, 0, 0);
  let fechaActual2 = new Date();
  fechaActual2.setMonth(fechaActual2.getMonth() + 12);

  let fechaLimitePago: string = format(fechaActual2, "DD/MM/YYYY");
  let totalaPagar = 0;


  let Id_Comercio = parseInt(body.Id_Comercio);
  let Password = body.Password;
  let Id_Banco = parseInt(body.Id_Banco);
  let Referencia_pago = parseInt(body.Referencia_pago);
  let Info_Adicional = body.Info_Adicional;

  let responseData: any = {
    Fecha_limite_pago: "",
    Valor_factura: "0",
    Codigo_Estado: "",
    Descripción_estado: "",
    Info_Adicional: "",
  };

  try {
    if (Id_Comercio.toString() === process.env.ZONAPAGOS_CAJA_IDCOMERCIO && Password === process.env.ZONAPAGOS_CAJA_PASS) {
      let resultObjectDB: any = await consultaFacturaBanco(Referencia_pago);

      console.log(resultObjectDB);

      // console.log(JSON.stringify(resultObjectDB));



      if (resultObjectDB != false) {
        let jsonResponse = JSON.parse(resultObjectDB.data[0].json_response);
        let categoria_id = resultObjectDB.data[0].categoria_pago_id;
        //  let categoria_id = 0;

        //verificamos si es un pago de matricula
        if (categoria_id == 1) {
          let matricula_id = (resultObjectDB.data[0].matricula_id).toString();

          let resultMatricula = await getInfoMatricula(matricula_id);
          let resultDB = resultMatricula[0][0];

          let periodo = await getFechasPeriodo(resultDB.cod_colegio, resultDB.cod_periodo);
          let finOrdianria = new Date(periodo.fec_fin_matordinaria);
          let iniOrdianria = new Date(periodo.fec_ini_matordinaria);

          //si no es matricula ordinaria
          if (fechaActual.getTime() > finOrdianria.getTime()) {
            fechaLimitePago = format(new Date(periodo.fec_fin_matextraord), "DD/MM/YYYY");
          } else if (fechaActual.getTime() <= finOrdianria.getTime() && fechaActual.getTime() >= iniOrdianria.getTime()) {
            fechaLimitePago = format(new Date(periodo.fec_fin_matordinaria), "DD/MM/YYYY");
          }

        }

        if (categoria_id == 5) {
          let matricula_id = (resultObjectDB.data[0].matricula_id).toString();

          let resultMatricula = await getInfoMatricula(matricula_id);
          let resultDB = resultMatricula[0][0];

          let periodo = await getFechasPeriodo(resultDB.cod_colegio, resultDB.cod_periodo);
          let finInscripcion = new Date(periodo.fec_fin_ins_nuevos);
          fechaLimitePago = format(finInscripcion, "DD/MM/YYYY");

        }


        //si existe fecha extra-ordinaria se debe cobrar el 10% mas

        responseData.Fecha_limite_pago = fechaLimitePago;
        responseData.Valor_factura = resultObjectDB.total;
        responseData.Codigo_Estado = "0";
        responseData.Descripción_estado = "Exitoso";


        if (resultObjectDB.data[0].estado_id == 1) {


          let resultDBPago = await existeDetPago(Referencia_pago, resultObjectDB.total);
          if (resultDBPago != false) {
            responseData.Codigo_Estado = "1";
            responseData.Descripción_estado = "Factura no disponible para pago / Cliente no Existe";
            responseData.Info_Adicional = "La factura " + Referencia_pago + " ya ha sido pagada";

          }

        }


      } else {
        responseData.Codigo_Estado = "1";
        responseData.Descripción_estado = "Factura no disponible para pago / Cliente no Existe";
        responseData.Info_Adicional = "No se encontro la factura " + Referencia_pago;
      }

      guardarLog({
        'url_service': req.protocol + '://' + req.get('host') + req.originalUrl,
        'json_body': JSON.stringify(body),
        'json_response': JSON.stringify(responseData),
        'estado': 1,
        'message': "OK",
        'host': req.headers['x-forwarded-for'] || req.connection.remoteAddress
      });

      res.status(200).json(responseData);

    } else {
      throw new Error("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    console.log(error.message);

    responseData.Codigo_Estado = "2";
    responseData.Descripción_estado = "Ocurrió un error inesperado en la operación";
    guardarLog({
      'url_service': req.protocol + '://' + req.get('host') + req.originalUrl,
      'json_body': JSON.stringify(body),
      'json_response': JSON.stringify(responseData),
      'estado': 0,
      'message': error.message,
      'host': req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    res.status(500).json(responseData);
  }
};

//===================================
//   /transaccion/registrarPagos
//===================================
export const registrarPagoService = async (req: any, res: any) => {
  //pendiente validar campos obligatorios
  let body = req.body;
  let Id_Comercio = parseInt(body.Id_Comercio);
  let Password = body.Password;
  let Id_Banco = parseInt(body.Id_Banco);
  let Referencia_pago = parseInt(body.Referencia_pago);
  let Fecha_pago = body.Fecha_pago;
  let Valor_pagado = body.Valor_pagado;
  let Id_transaccion = body.Id_transaccion;
  let Info_Adicional = body.Info_adicional;

  let horaActual = format(new Date(), 'HH:mm:ss');

  let responseData: any = {
    Severidad: "",
    Descripcion: "",
    Codigo_Estado: "",
  };

  try {
    if (Id_Comercio.toString() === process.env.ZONAPAGOS_CAJA_IDCOMERCIO && Password === process.env.ZONAPAGOS_CAJA_PASS) {
      let detPago: any = [];

      //aqui la consulta encargada de actualizar el pago
      let resultObjectDB: any = await consultaFacturaBanco(Referencia_pago);

      if (resultObjectDB == false) {
        throw new Error("No se ecnontro la factura " + Referencia_pago);
      }

      if (resultObjectDB.data[0].estado_id == 1) {

        let resultDBPago = await existeDetPago(Referencia_pago, resultObjectDB.total);
        if (resultDBPago != false) {
          throw new Error("La factura " + Referencia_pago + " ya se encuentra pagada");
        }

      }

      let categoria_id = resultObjectDB.data[0].categoria_pago_id;

      if (categoria_id == 1) {
        let matricula_id = (resultObjectDB.data[0].matricula_id).toString();

        let resultMatricula = await getInfoMatricula(matricula_id);
        let resultDB = resultMatricula[0][0];
        //consular los descuentos y multas que un estudiante tiene asignados
        let resultDto = await getDescuento(categoria_id, resultDB.cod_periodo, resultDB.ide_persona);

        if (resultDto.length > 0) {
          let idsDescuento: any = [];
          resultDto.forEach((e: any) => {
            idsDescuento.push(e._id);
          });

          console.log("Se encontraron descuentos");
          let resultUpdateDB = await updateEstadoDescuentoFac(idsDescuento, Referencia_pago);
          console.log(resultUpdateDB);
        } else {
          console.log("NO Se encontraron descuentos");
        }
      }


      detPago.push({
        '_id': uuidv4(),
        'pago_id': Referencia_pago,
        'valor_pago': Valor_pagado,
        'total_pago': resultObjectDB.total,
        'valor_iva_pago': 0,
        'estado_pago_id': 1,
        'forma_pago_id': 99,
        'nombre_banco': Id_Banco,
        'codigo_transaccion': Id_transaccion,
        'fecha': format(parse(Fecha_pago + " " + horaActual, "DD/MM/YYYY HH:mm:ss"), 'YYYY-MM-DD HH:mm:ss'),
        'campo1': (Info_Adicional) ? Info_Adicional : null,
      });

      //preparamos la data para guardar
      let tPago: any = {
        estado_id: 1,
        fecha_update: format(parse(Fecha_pago + " " + horaActual, "DD/MM/YYYY HH:mm:ss"), 'YYYY-MM-DD HH:mm:ss'),
      };

      let resultUpdatePago = await actualizarPagoyDetalle(Referencia_pago, tPago, detPago);

      if (resultUpdatePago != false) {
        responseData.Codigo_Estado = "0";
        responseData.Severidad = "I";
        responseData.Descripcion = "Se realizó exitosamente la actualización del pago.";

        //ACTUALIZAMOS EL ESTADO DE CADA DESCUENTO

        let categoria_id = resultObjectDB.data[0].categoria_pago_id;
        if (categoria_id == 1) {
          let matricula_id = (resultObjectDB.data[0].matricula_id).toString();

          let resultMatricula = await getInfoMatricula(matricula_id);
          let resultDB = resultMatricula[0][0];
          //consular los descuentos y multas que un estudiante tiene asignados
          let resultDto = await getDescuento(categoria_id, resultDB.cod_periodo, resultDB.ide_persona);

          if (resultDto.length > 0) {
            let idsDescuento: any = [];
            resultDto.forEach((e: any) => {
              idsDescuento.push(e._id);
            });

            console.log("Se encontraron descuentos");
            let resultUpdateDB = await updateEstadoDescuentoFac(idsDescuento, Referencia_pago);
            console.log(resultUpdateDB);
          } else {
            console.log("NO Se encontraron descuentos");
          }

        }





      } else {
        responseData.Codigo_Estado = "1";
        responseData.Severidad = "W";
        responseData.Descripción_estado = "No se pudo realizar la actualización del pago.";
      }


      guardarLog({
        'url_service': req.protocol + '://' + req.get('host') + req.originalUrl,
        'json_body': JSON.stringify(body),
        'json_response': JSON.stringify(responseData),
        'estado': 1,
        'message': "OK",
        'host': req.headers['x-forwarded-for'] || req.connection.remoteAddress
      });
      res.status(200).json(responseData);


    } else {
      throw new Error("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    console.log(error.message);
    responseData.Codigo_Estado = "1";
    responseData.Severidad = "E";
    responseData.Descripcion = "Ocurrió un error inesperado en la operación: ";
    guardarLog({
      'url_service': req.protocol + '://' + req.get('host') + req.originalUrl,
      'json_body': JSON.stringify(body),
      'json_response': JSON.stringify(responseData),
      'estado': 0,
      'message': error.message,
      'host': req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    res.status(500).json(responseData);
  }
};







//===================================
//   /transaccion/reversarPagos
//===================================
export const reversarPagoService = async (req: any, res: any) => {
  //pendiente validar campos obligatorios
  let body = req.body;

  let Id_Comercio = parseInt(body.Id_Comercio);
  let Password = body.Password;
  let Id_Banco = parseInt(body.Id_Banco);
  let Referencia_pago = parseInt(body.Referencia_pago);
  let Fecha_reverso = body.Fecha_reverso;
  let Valor_pagado = body.Valor_pagado;
  let Id_transaccion = body.Id_transaccion;
  let Info_Adicional = body.Info_adicional;

  let horaActual = format(new Date(), 'HH:mm:ss');

  let responseData: any = {
    Severidad: "",
    Descripcion: "",
    Codigo_Estado: "",
  };

  try {
    if (
      Id_Comercio.toString() === process.env.ZONAPAGOS_CAJA_IDCOMERCIO && Password === process.env.ZONAPAGOS_CAJA_PASS) {

      //comprobamos si existe el pago en la DB

      //aqui la consulta encargada de actualizar el pago
      let resultObjectDB: any = await consultaFacturaBanco(Referencia_pago);

      if (resultObjectDB == false) {
        throw new Error("No se encontro la factura: " + Referencia_pago);
      }

      if (resultObjectDB.data[0].estado_id != 1) {
        throw new Error("No se encontraron facturas pagadas para reverso");
      }



      //verificar si existen pagos
      let resultDBPago = await consultarPagoFactura(
        {
          'codigo_transaccion': Id_transaccion,
          'pago_id': Referencia_pago,
          'valor_pago': Valor_pagado
        }
      );
      if (!resultDBPago) {
        throw new Error("No se encontraron pagos realizados para la factura " + Referencia_pago);
      }



      let detPago: any = {
        'pago_id': Referencia_pago,
        'valor_pago': Valor_pagado,
        'total_pago': resultObjectDB.total,
        'estado_pago_id': 200,
        'nombre_banco': Id_Banco,
        'codigo_transaccion': Id_transaccion,
      };


      //preparamos la data para guardar
      let tPago: any = {
        'estado_id': 200,
        'fecha_update': format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        'fecha_reverso': format(parse(Fecha_reverso + " " + horaActual, "DD/MM/YYYY HH:mm:ss"), 'YYYY-MM-DD HH:mm:ss'),
        'valor_reverso': Valor_pagado,
      };

      let resultUpdatePago = await reversarPagoyDetalle(Referencia_pago, tPago, detPago);
      console.log(resultUpdatePago);

      if (resultUpdatePago != false) {
        responseData.Codigo_Estado = "0";
        responseData.Severidad = "I";
        responseData.Descripcion = "Se realizó exitosamente el reverso del pago";
      } else {
        responseData.Codigo_Estado = "1";
        responseData.Severidad = "W";
        responseData.Descripción_estado = "No se pudo realizar el reverso del pago.";
      }

      guardarLog({
        'url_service': req.protocol + '://' + req.get('host') + req.originalUrl,
        'json_body': JSON.stringify(body),
        'json_response': JSON.stringify(responseData),
        'estado': 1,
        'message': "OK",
        'host': req.headers['x-forwarded-for'] || req.connection.remoteAddress
      });
      res.status(200).json(responseData);


    } else {
      throw new Error("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    console.log(error.message);
    responseData.Codigo_Estado = "2";
    responseData.Severidad = "E";
    responseData.Descripcion = "Ocurrió un error inesperado en la operación: ";
    guardarLog({
      'url_service': req.protocol + '://' + req.get('host') + req.originalUrl,
      'json_body': JSON.stringify(body),
      'json_response': JSON.stringify(responseData),
      'estado': 0,
      'message': error.message,
      'host': req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    res.status(500).json(responseData);
  }
};






//==========================================================
//  SERVICIOS PARA CONSULTAR ESTADOS DE FACTURA Y PAGOS
//==========================================================



//==========================================================
//  transaccion/ConsultaEstadoFactura
//==========================================================
export const consultaEstadoFactura = async (req: any, res: any) => {

  let body = req.body;

  try {
    let total_a_pagarString: any = moneda.format(0, { locale: 'es-CO' }).replace('$', '').trim();

    let resultDB = await consultaFacturaCliente(body.id_cliente, body.tipo);
    let jsonData: any = {};
    if (resultDB.length > 0) {
      jsonData = JSON.parse(resultDB[0].json_response);
    }
    let cliente: any = jsonData.info_cliente;

    let det_factua = [];
    let facturas: any = [];


    for (const row of resultDB) {
      let existe = false;

      for (const fac of facturas) {
        if (fac.id == row._id) {
          existe = true;
        }
      }

      if (!existe) {
        facturas.push({
          "id": row._id,
          "codigo": row.codigo,
          "descripcion": row.descripcion,
          "categoria": row.categoria,
          "fecha": format(row.fecha, 'DD-MM-YYYY hh:mm:ss A')
        });
      }
    }

    if (facturas.length > 0) {
      console.log("ejecutando verificador");
      await Verificadorpago(facturas[0].id)
    }

    //recorrer las facturas para llenar el detalle
    for (const factura of facturas) {
      //verifica el pago en zona pagos y actualiza en la db

      let total_a_pagar = 0;
      let pagosDB = await consultaPagoFacturaCliente(factura.id);

      for (const pago of pagosDB) {
        pago.fecha = format(pago.fecha, 'DD-MM-YYYY hh:mm:ss A')
      }

      let det_factua = [];
      for (const row of resultDB) {
        if (factura.id == row._id) {
          let subtotal = (row.valor_unidad - (row.valor_unidad * row.descuento) + (row.valor_unidad * row.aumento));
          det_factua.push({
            'concepto': (row.cod_paquete == 0) ? row.descripcion : row.concepto,
            'descuento': row.descuento,
            'aumento': row.aumento,
            'valor_unidad': row.valor_unidad,
            'cantidad': row.cantidad
          });
          total_a_pagar = total_a_pagar + subtotal;
        }

      }
      factura.det_factura = det_factua;
      factura.pagos = pagosDB;
      factura.total_a_pagar_s = moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim();
    }

    res.status(200).json({
      error: false,
      message: "Ejecucion correcta",
      data: {
        cliente: cliente,
        facturas
      }
    });


  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: error.message
    });
  }
}


//===================================
//   /transaccion/DetalleFactura/:ref
//===================================
export const detalleFacturaByID = async (req: any, res: any) => {

  let body = req.body;
  let idFactura = req.params.ref;


  try {

    let factura = await getDataDetalleFacturaById(idFactura);

    return res.status(200).json({
      error: false,
      message: "Ejecucion correcta",
      data: factura
    });


  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: error.message
    });
  }

}

//usado para contruir recibo de pago y servicio
export const getDataDetalleFacturaById = async (idFactura: any) => {
  let factura: any = {};
  let det_factura: any = [];
  let total_a_pagar = 0;
  let cliente: any = {};
  try {

    let dataConceptos = await getFactura(idFactura);


    //si encuentra conceptos en la factura
    if (dataConceptos.length > 0) {

      for (const pago of dataConceptos) {
        pago.fecha = format(pago.fecha, 'DD-MM-YYYY hh:mm:ss A')

        factura = {
          "id": pago._id,
          "codigo": pago.codigo,
          "descripcion": pago.desc_factura,
          "categoria": pago.categoria,
          "fecha": pago.fecha
        };
        let json_response = JSON.parse(pago.json_response);
        cliente = json_response.info_cliente;

        delete pago.json_response;


        let subtotal = (pago.valor_unidad - (pago.valor_unidad * pago.descuento) + (pago.valor_unidad * pago.aumento));
        total_a_pagar = total_a_pagar + subtotal;
        det_factura.push({

          'concepto': (pago.cod_paquete == 0) ? pago.descripcion : pago.concepto,
          'descuento': (pago.descuento * 100),
          'aumento': pago.aumento,
          'valor_unidad': moneda.format(pago.valor_unidad, { locale: 'es-CO' }).replace('$', '').trim(),
          'cantidad': pago.cantidad,
          'subtotal': moneda.format(subtotal, { locale: 'es-CO' }).replace('$', '').trim()
        });

      }

    }


    let dataPagos = await getPagoFactura(idFactura);
    for (const pago of dataPagos) {
      pago.fecha = format(pago.fecha, 'DD-MM-YYYY hh:mm:ss A');
      pago.nombre_banco = (pago.nombre_banco == null) ? "NO APLICA" : pago.nombre_banco;
      pago.codigo_transaccion = (pago.codigo_transaccion == null) ? "NO APLICA" : pago.codigo_transaccion;
      pago.ticketID = (pago.ticketID == null) ? "NO APLICA" : pago.ticketID;
      pago.numero_tarjeta = (pago.numero_tarjeta == null) ? "NO APLICA" : pago.numero_tarjeta;
      pago.franquicia = (pago.franquicia == null) ? "NO APLICA" : pago.franquicia;
      pago.cod_aprobacion = (pago.cod_aprobacion == null) ? "NO APLICA" : pago.cod_aprobacion;
      pago.num_recibido = (pago.num_recibido == null) ? "NO APLICA" : pago.num_recibido;
    }

    let dataDescuentos = await getDescuentoFactura(idFactura);
    for (const dsto of dataDescuentos) {
      dsto.fecha = format(dsto.fecha, 'DD-MM-YYYY');
      dsto.porcentaje = dsto.porcentaje * 100;
    }

    factura.det_factura = det_factura;
    factura.pagos = dataPagos;
    factura.descuentos = dataDescuentos;
    factura.cliente = cliente;
    factura.total_a_pagar_s = moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim();

    return factura;

  } catch (error) {
    throw new Error(error.message);
  }
}



