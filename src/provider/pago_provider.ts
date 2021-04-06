import { conDB } from "../config/database";

export const guardarPago = async (params: any) => {
  let result = await conDB("fin_pago").insert(params);
  return result;
};

//Usado por las tareas cron para verificar los pagos cada cierto tiempo
export const obtenerPagosPendientes = async (
  minutos: number,
  forma_pago_ids: any
) => {
  const sql = `SELECT  fin_pago._id, fin_pago.codigo FROM 
    fin_pago LEFT JOIN fin_detalle_pago ON (fin_pago._id = fin_detalle_pago.pago_id)
    WHERE (fin_detalle_pago.estado_pago_id = 999 OR fin_pago.estado_id=4001)
    AND TIMESTAMPDIFF(MINUTE,fin_pago.fecha,NOW()) >= ?
    AND fin_detalle_pago.forma_pago_id IN (?)`;

  let result = await conDB.raw(sql, [minutos, forma_pago_ids]);
  if (result[0].length > 0) {
    return result[0];
  } {
    return false;
  }


};

export const detIdPagoByCodigo = async (codigo: any) => {
  let result = await conDB
    .select("_id")
    .from("fin_pago")
    .where("codigo", codigo);
  if (result.length > 0) {
    return result[0]._id;
  } else {
    return false;
  }
};

export const actualizarEstadoPago = async (params: any, codigo: string) => {
  let result = await conDB("fin_pago").where("codigo", codigo).update(params);
  return result;
};

export const getConceptos = async (ids: any) => {
  let result = await conDB
    .select("_id", "codigo", "descripcion", "valor")
    .from("fin_concepto")
    .whereIn("_id", ids);
  return result;
};

export const getConceptosPaquete = async (codigo: any) => {
  let result = await conDB("fin_paquete")
    .join(
      "fin_detalle_paquete",
      "fin_paquete._id",
      "=",
      "fin_detalle_paquete.paquete_id"
    )
    .select(
      "fin_paquete._id",
      "fin_paquete.descripcion",
      "fin_paquete.categoria_id",
      "fin_paquete.tipo",
      "fin_detalle_paquete._id",
      "fin_detalle_paquete.valor_unidad",
      "fin_detalle_paquete.cantidad",
      "fin_detalle_paquete.descuento",
      "fin_detalle_paquete.aumento"
    )
    .where("fin_paquete.codigo", codigo);
  return result;
};

export const guardarPagoyDetalle = async (params: any, tDetallePago: any) => {
  let id = 0;
  console.log(tDetallePago);
  const trx = await conDB.transaction();
  return await trx("fin_pago")
    .insert(params)
    .then((ids: any) => {
      let detalle: any = tDetallePago;

      detalle.forEach((det: any) => (det.pago_id = ids[0]));
      id = ids;
      return trx("fin_detalle_factura").insert(detalle);
    })

    .then((result: any) => {
      trx.commit();
      return id;
    })
    .catch((result: any) => {
      trx.rollback();
      return false;
    });
};

export const actualizarPagoyDetalle = async (id: any, dataInsert: any) => {
  const trx = await conDB.transaction();
  return await trx("fin_detalle_pago")
    .where("pago_id", id)
    .del()
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


//obtiene la configuracion del periodo
//traer la configuracion mas reciente
export const getConfigPeriodo = async () => {
  let result = await conDB
    .select()
    .from("fin_config")
    .where("estado", 1)
    .limit(1).first();
  return result;
};

//obtiene el detalle de un paquete
export const getPaquete = async (id_periodo: any, codigo: any) => {
  let sql = `SELECT
  fin_paquete.codigo
  , fin_paquete.descripcion AS paquete
  , fin_concepto.descripcion AS concepto
  , fin_detalle_paquete.valor_unidad
  , fin_detalle_paquete.cantidad
  , fin_detalle_paquete.aumento
  , IF(fin_detalle_paquete.cantidad > 0, SUM( (fin_detalle_paquete.cantidad * fin_detalle_paquete.valor_unidad) - ( (fin_detalle_paquete.cantidad * fin_detalle_paquete.valor_unidad) * fin_detalle_paquete.aumento) -   ( (fin_detalle_paquete.cantidad * fin_detalle_paquete.valor_unidad) * fin_detalle_paquete.descuento) ), fin_detalle_paquete.valor_unidad ) AS subtotal
  , fin_detalle_paquete.descuento
  , fin_concepto.fecha_actualizacion
  ,fin_detalle_paquete.descuento_ext
  , fin_detalle_paquete.concepto_id
FROM
  fin_paquete
  INNER JOIN fin_config 
      ON (fin_paquete.config_id = fin_config._id)
  INNER JOIN fin_detalle_paquete 
      ON (fin_detalle_paquete.paquete_id = fin_paquete._id)
  INNER JOIN fin_concepto 
      ON (fin_detalle_paquete.concepto_id = fin_concepto._id)
      WHERE fin_paquete.periodo_id=?
      AND fin_paquete.codigo=?
      GROUP BY fin_detalle_paquete._id
      `;
      

  let result =  await conDB.raw(sql, [id_periodo, codigo]);
  if (result[0].length > 0) {
    return result[0];
} else {
    return false;
}
};


//consulta descuentos a un estudiante
export const getDescuento = async (cod_matricula:any, periodo_id:any) => {
  let result = await conDB
  .select()
  .from("fin _porcentaje_soporte")
  .where({ 'matricula_id': cod_matricula, 'periodo_id': periodo_id });
  return result;
};


