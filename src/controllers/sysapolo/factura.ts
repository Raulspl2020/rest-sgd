import { format } from "date-format-parse";
import { syslistarFacturasPagadas } from "../../provider/sys_apolo/factura_provider";
import * as moneda from 'currency-formatter';
import { verificaPagosNpago } from "../../helpers/cron_job";


//====================
//   /factura/listar
//=====================

export const getFacturasPagadas = async (req: any, res: any) => {
  let det_factua = [];
  let facturas: any = [];


  try {
    let resultDB = await syslistarFacturasPagadas();
    let jsonData: any = {};
    if (resultDB.length > 0) {
      jsonData = JSON.parse(resultDB[0].json_response);
    }
    let cliente: any = jsonData.info_cliente;


    //llenamos un arreglo con los encabezados de cada factura
    for (const row of resultDB) {
      let existe = false;

      for (const fac of facturas) {
        if (fac.id == row.id) {
          existe = true;
        }
      }

      let json_response = JSON.parse(row.json_response);
      cliente = json_response?.info_cliente;
      let det_factua: any = json_response?.det_factura || [];


      if (!existe) {
        facturas.push({
          "id": row.id,
          "codigo": row.codigo,
          "desc_factura": row.desc_factura,
          'sysapolo_verify': row.sysapolo_verify,
          "fecha": format(row.fecha, 'DD-MM-YYYY hh:mm:ss A'),
          "items": det_factua.length,
          "cliente": cliente
        });
      }
    }




    //recorrer las facturas para llenar el detalle
    for (const factura of facturas) {
      //verifica el pago en zona pagos y actualiza en la db

      let total_a_pagar = 0;


      let det_factua = [];
      let contador: number = 0;
      for (const row of resultDB) {
        if (factura.id == row.id) {
          contador = contador + 1;
          let subtotal = (row.valor_unidad - (row.valor_unidad * row.descuento) + (row.valor_unidad * row.aumento));
          det_factua.push({
            'concepto': row.concepto,
            'cod_concepto': row.cod_concepto_sys,
            'descuento': row.descuento,
            'aumento': row.aumento,
            'valor_unidad': row.valor_unidad,
            'cantidad': row.cantidad,
            'subtotal': subtotal
          });
          total_a_pagar = total_a_pagar + subtotal;
        }
      }

      factura.det_factura = det_factua;
      factura.total_a_pagar_s = moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim();
      factura.total_a_pagar_i = total_a_pagar;
      factura.borrar = false;

      if (contador != parseInt(factura.items)) {
        factura.borrar = true;
      }


    }

    if (facturas[facturas.length - 1].borrar) {
      facturas.splice(facturas.length - 1, 1);
    }


    res.json({
      error: false,
      message: "Ejecucion correcta",
      data: facturas
    });
  } catch (error) {
    console.log(error);
    res.json({
      error: true,
      message: error.message,
    });
  }

};



//====================
//   /factura/registrar
//=====================

export const registrarFacturasPagadaSys = async (req: any, res: any) => {


}