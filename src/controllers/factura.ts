//====================
//   /transaccion/consultaFactura

import { parse, format } from 'date-format-parse';
import { consultaFacturaBanco } from "../provider/factura_provider";

//=====================
export const consultaFacturaService = async (req: any, res: any) => {
  //pendiente validar campos obligatorios
  let body = req.body;

  let Id_Comercio = body.Id_Comercio;
  let Password = body.Password;
  let Id_Banco = body.Id_Banco;
  let Referencia_pago = body.Referencia_pago;
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
      Id_Comercio === process.env.ZONAPAGOS_ID &&
      Password === process.env.ZONAPAGOS_PASS
    ) {
      let resultObjectDB:any = await consultaFacturaBanco(Referencia_pago);

      if (resultObjectDB != false) {
      } else {
        responseData.Codigo_Estado = "1";
        responseData.Descripción_estado ="Factura no disponible para pago / Cliente no Existe";
        res.status(200).json(responseData);
      }

      let jsonResponse = JSON.parse(resultObjectDB.data[0].json_response);


      responseData.Fecha_limite_pago =  format(parse(jsonResponse.general.fecha_fin_extraordinaria, 'DD-MM-YYYY'), 'DD/MM/YYYY'); 
      responseData.Valor_factura = resultObjectDB.total;
      responseData.Codigo_Estado = "0";
      responseData.Descripción_estado = "Exitoso";

      res.status(200).json(responseData);
    } else {
      throw new Error("Usuario o contraseña incorrectos");
    }
  } catch (error) {
    console.log(error.message);

    responseData.Codigo_Estado = "2";
    responseData.Descripción_estado ="Ocurrió un error inesperado en la operación";
    res.status(500).json(responseData);
  }
};
