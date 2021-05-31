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


//compueba si existe un detalle de pago
export const existeDetPago = async (where: any) => {

  let result = await conDB
    .select()
    .from("fin_detalle_pago")
    .where(where)
  if (result.length > 0) {
    return result[0];
  }else{
    return false;
  }


}


export const actualizarPagoyDetalle = async (id: any, pago: any, dataInsert: any) => {
  const trx = await conDB.transaction();
  return await trx("fin_pago")
    .where("fin_pago._id", id)
    .update(pago)
    .then((ids: any) => {
      let detalle: any = dataInsert;
      return trx("fin_detalle_pago").insert(detalle);
    })
    .then((result: any) => {
      trx.commit();
      return true;
    })
    .catch((result: any) => {
      console.log(result);
      trx.rollback();
      return false;
    });
};


//permite corregir los pagos relizados, eliminando los pagos de una factura y creando unos nuevos
export const reversarPagoyDetalle = async (id: any, pago: any, dataInsert: any) => {

  
  const trx = await conDB.transaction();
  return await trx("fin_pago")
    .where("fin_pago._id", id)
    .update(pago)
    .then((ids: any) => {

      //eliminar todos los pagos de la factua
      return conDB("fin_detalle_pago")
      .where({
        'nombre_banco':dataInsert.nombre_banco,
        'codigo_transaccion':dataInsert.codigo_transaccion,
        'pago_id': dataInsert.pago_id,
        'valor_pago':dataInsert.valor_pago
      })
      .del();    

    })
    .then((result: any) => {
      trx.commit();
      return true;
    })
    .catch((result: any) => {
      console.log(result);
      trx.rollback();
      return false;
    });
};