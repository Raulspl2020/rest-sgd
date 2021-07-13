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
    , fin_pago.categoria_pago_id
    , fin_pago.periodo_id
    , fin_pago.matricula_id
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


//compueba si existe un detalle de pago exitoso por el mismo valor de a factura
export const existeDetPago = async (pago_id: any, valor:number) => {

  let result = await conDB
    .select()
    .from("fin_detalle_pago")
    .where({'pago_id':pago_id,  'estado_pago_id': 1})
    .whereRaw('valor_pago >=?', [valor])
  if (result.length > 0) {
    return result[0];
  } else {
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



export const consultarPagoFactura = async (where: any) => {
  let result = await conDB
    .select()
    .from("fin_pago")
    .join(
      "fin_detalle_pago", "fin_pago._id",
      "=",
      "fin_detalle_pago.pago_id"
    )
    .where(where);

  if (result.length > 0) {
    return result;
  } else {
    return false;
  }
}


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
          'codigo_transaccion': dataInsert.codigo_transaccion,
          'pago_id': dataInsert.pago_id,
          'valor_pago': dataInsert.valor_pago
        })
        .del();

    })
    .then((result: any) => {
      trx.commit();
      console.log(result);
      return true;
    })
    .catch((result: any) => {
      console.log(result);
      trx.rollback();
      return false;
    });
};


//metodos para consultar estados de facturas y pagos

export const consultaFacturaCliente = async (id_cliente: any) => {

  let sql = `SELECT
  fin_pago._id
  , fin_pago.codigo
  , fin_pago.descripcion
  , fin_pago.cod_paquete
  , fin_pago.json_response
  , fin_pago.fecha
  , fin_pago.valor
  , fin_concepto.descripcion as concepto
  , fin_detalle_factura.descuento
  , fin_detalle_factura.aumento
  , fin_detalle_factura.valor_unidad
  , fin_detalle_factura.cantidad
  , fin_categoria_pago.descripcion as categoria
FROM
  fin_detalle_factura
  INNER JOIN fin_pago 
      ON (fin_detalle_factura.pago_id = fin_pago._id)
  INNER JOIN fin_categoria_pago 
      ON (fin_pago.categoria_pago_id = fin_categoria_pago._id)
  INNER JOIN fin_concepto 
      ON (fin_detalle_factura.concepto_id = fin_concepto._id)
              WHERE fin_pago.estudiante_id = ?
      GROUP BY fin_detalle_factura._id
      ORDER BY fin_pago._id DESC`;

  let result = await conDB.raw(sql, [id_cliente]);
  if (result[0].length > 0) {
    return result[0];
  } else {
    return [];
  }
};
export const consultaPagoFacturaCliente = async (id_factura: any) => {

  let sql = `SELECT
  fin_detalle_pago._id as id
  , fin_detalle_pago.pago_id
  , fin_detalle_pago.valor_pago
  , fin_detalle_pago.total_pago
  , fin_detalle_pago.fecha
  , fin_estado_pago.descripcion AS estado
  , fin_estado_pago._id as estado_pago_id
  , fin_forma_pago.descripcion AS forma_pago
  , fin_detalle_pago.nombre_banco
  , fin_detalle_pago.codigo_transaccion
  , fin_detalle_pago.ticketID
  , fin_detalle_pago.numero_tarjeta
  , fin_detalle_pago.franquicia
  , fin_detalle_pago.cod_aprobacion
  , fin_detalle_pago.num_recibido
FROM
  fin_detalle_pago
  INNER JOIN fin_estado_pago 
      ON (fin_detalle_pago.estado_pago_id = fin_estado_pago._id)
  LEFT JOIN fin_forma_pago 
      ON (fin_detalle_pago.forma_pago_id = fin_forma_pago._id)
      WHERE fin_detalle_pago.pago_id = ?
      ORDER BY fin_detalle_pago.fecha DESC`;

  let result = await conDB.raw(sql, [id_factura]);
  if (result[0].length > 0) {
    return result[0];
  } else {
    return [];
  }
};