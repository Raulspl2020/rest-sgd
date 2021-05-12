import { conDB } from "../config/database";

//consulta la factura si esta disponible
export const consultaFacturaBanco = async (id: any) => {

  let sql = `SELECT
    fin_pago._id
    , fin_pago.codigo
    , fin_pago.json_response
    , fin_pago.codigo_barras
    , fin_pago.estado_id
    , fin_pago.estudiante_id
    , fin_pago.valor as valor_factura
    , fin_detalle_factura.descuento
    , fin_detalle_factura.aumento
    , fin_detalle_factura.valor_unidad
    , fin_detalle_factura.cantidad
FROM
    fin_detalle_factura
    INNER JOIN fin_pago 
        ON (fin_detalle_factura.pago_id = fin_pago._id)
        WHERE fin_pago._id = ?
        GROUP BY  fin_detalle_factura._id`;

  let result = await conDB.raw(sql, [id]);
  if (result[0].length > 0) {
    //return result[0];
    let resultArray = [];
    let data = result[0];
    let totalFinal = 0;
    data.forEach((element: any) => {
      let total = element.valor_unidad * element.cantidad;
      let descuento = total * element.descuento;
      let aumento = total * element.aumento;
      let subtotal = (total + aumento) - descuento;
      totalFinal = totalFinal + subtotal;
    });

    return {
      data: result[0],
      total: totalFinal.toFixed(2),
    };
  } else {
    return false;
  }
};
