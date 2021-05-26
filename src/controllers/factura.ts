import { parse, format } from "date-format-parse";
import { actualizarPagoyDetalle, consultaFacturaBanco, reversarPagoyDetalle } from "../provider/factura_provider";
import { v4 as uuidv4 } from 'uuid';

//====================
//   /transaccion/consultaFactura
//=====================
export const consultaFacturaService = async (req: any, res: any) => {
  //pendiente validar campos obligatorios
  let body = req.body;

  let Id_Comercio = body.Id_Comercio;
  let Password = body.Password;
  let Id_Banco = body.Id_Banco;
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
    if (
      Id_Comercio === process.env.ZONAPAGOS_CAJA_IDCOMERCIO &&
      Password === process.env.ZONAPAGOS_CAJA_PASS
    ) {
      let resultObjectDB: any = await consultaFacturaBanco(Referencia_pago);

      if (resultObjectDB != false) {
        let jsonResponse = JSON.parse(resultObjectDB.data[0].json_response);

        responseData.Fecha_limite_pago = format(
          parse(jsonResponse.general.fecha_fin_extraordinaria, "DD-MM-YYYY"),
          "DD/MM/YYYY"
        );
        responseData.Valor_factura = resultObjectDB.total;
        responseData.Codigo_Estado = "0";
        responseData.Descripción_estado = "Exitoso";

        res.status(200).json(responseData);
      } else {
        responseData.Codigo_Estado = "1";
        responseData.Descripción_estado =
          "Factura no disponible para pago / Cliente no Existe";
        res.status(200).json(responseData);
      }
    } else {
      throw new Error("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    console.log(error.message);

    responseData.Codigo_Estado = "2";
    responseData.Descripción_estado =
      "Ocurrió un error inesperado en la operación";
    res.status(500).json(responseData);
  }
};

//===================================
//   /transaccion/registrarPagos
//===================================
export const registrarPagoService = async (req: any, res: any) => {
  //pendiente validar campos obligatorios
  let body = req.body;

  let Id_Comercio = body.Id_Comercio;
  let Password = body.Password;
  let Id_Banco = body.Id_Banco;
  let Referencia_pago = parseInt(body.Referencia_pago);
  let Fecha_pago = body.Fecha_pago;
  let Valor_pagado = body.Valor_pagado;
  let Id_transacción = body.Id_transacción;
  let Info_Adicional = body.Info_Adicional;

  let horaActual = format(new Date(),'HH:mm:ss');

  let responseData: any = {
    Severidad: "",
    Descripcion: "",
    Codigo_Estado: "",
  };

  try {
    if (
      Id_Comercio === process.env.ZONAPAGOS_CAJA_IDCOMERCIO &&
      Password === process.env.ZONAPAGOS_CAJA_PASS
    ) {
      let detPago: any = [];

            //aqui la consulta encargada de actualizar el pago
      let resultObjectDB: any = await consultaFacturaBanco(Referencia_pago);

      detPago.push({
        '_id': uuidv4(),
        'pago_id': Referencia_pago,
        'valor_pago': Valor_pagado,
        'total_pago': resultObjectDB.total,
        'valor_iva_pago': 0,
        'estado_pago_id': 1,
        'forma_pago_id': 99,
        'nombre_banco': Id_Banco,
        'codigo_transaccion': Id_transacción,
        'fecha': format(parse(Fecha_pago+" "+horaActual, "DD/MM/YYYY HH:mm:ss"), 'YYYY-MM-DD HH:mm:ss'),
        'campo1': Info_Adicional,
      });

      //preparamos la data para guardar
      let tPago: any = {
        estado_id: 1,
        fecha_update: format(parse(Fecha_pago+" "+horaActual, "DD/MM/YYYY HH:mm:ss"), 'YYYY-MM-DD HH:mm:ss'),
      };

      let resultUpdatePago = await actualizarPagoyDetalle(Referencia_pago,tPago,detPago);

      if (resultUpdatePago != false) {
        responseData.Codigo_Estado = "0";
        responseData.Severidad = "I";
        responseData.Descripcion ="Se realizó exitosamente la actualización del pago.";
        res.status(200).json(responseData);
      } else {
        responseData.Codigo_Estado = "1";
        responseData.Severidad = "W";
        responseData.Descripción_estado ="No se pudo realizar la actualización del pago.";
        res.status(200).json(responseData);
      }
    } else {
      throw new Error("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    responseData.Codigo_Estado = "2";
    responseData.Severidad = "E";
    responseData.Descripcion = "Ocurrió un error inesperado en la operación: ";
    res.status(500).json(responseData);
  }
};







//===================================
//   /transaccion/reversarPagos
//===================================
export const reversarPagoService = async (req: any, res: any) => {
  //pendiente validar campos obligatorios
  let body = req.body;

  let Id_Comercio = body.Id_Comercio;
  let Password = body.Password;
  let Id_Banco = body.Id_Banco;
  let Referencia_pago = parseInt(body.Referencia_pago);
  let Fecha_reverso = body.Fecha_reverso;
  let Valor_pagado = body.Valor_pagado;
  let Id_transacción = body.Id_transacción;
  let Info_Adicional = body.Info_Adicional;

  let horaActual = format(new Date(),'HH:mm:ss');

  let responseData: any = {
    Severidad: "",
    Descripcion: "",
    Codigo_Estado: "",
  };

  try {
    if (
      Id_Comercio === process.env.ZONAPAGOS_CAJA_IDCOMERCIO &&
      Password === process.env.ZONAPAGOS_CAJA_PASS
    ) {

      //aqui la consulta encargada de actualizar el pago
      let resultObjectDB: any = await consultaFacturaBanco(Referencia_pago);

      let detPago: any = {
        '_id': uuidv4(),
        'pago_id': Referencia_pago,
        'valor_pago': Valor_pagado,
        'total_pago': resultObjectDB.total,
        'valor_iva_pago': 0,
        'estado_pago_id': 1,
        'forma_pago_id': 99,
        'nombre_banco': Id_Banco,
        'codigo_transaccion': Id_transacción,
        'fecha': format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        'fecha_reverso': format(parse(Fecha_reverso + " " + horaActual, "DD/MM/YYYY HH:mm:ss"), 'YYYY-MM-DD HH:mm:ss'),
        'campo1': (Info_Adicional) ?  Info_Adicional : null,
      };


      //preparamos la data para guardar
      let tPago: any = {
        estado_id: 1,
        fecha_update: format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      };

      let resultUpdatePago = await reversarPagoyDetalle(Referencia_pago, tPago, detPago);
      console.log(resultUpdatePago);

      if (resultUpdatePago != false) {
        responseData.Codigo_Estado = "0";
        responseData.Severidad = "I";
        responseData.Descripcion = "Se realizó exitosamente el reverso del pago";
        res.status(200).json(responseData);
      } else {
        responseData.Codigo_Estado = "1";
        responseData.Severidad = "W";
        responseData.Descripción_estado = "No se pudo realizar el reverso del pago.";
        res.status(200).json(responseData);
      }
    } else {
      throw new Error("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    responseData.Codigo_Estado = "2";
    responseData.Severidad = "E";
    responseData.Descripcion = "Ocurrió un error inesperado en la operación: ";
    res.status(500).json(responseData);
  }
};
