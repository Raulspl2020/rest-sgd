import { conDB } from "../config/database";
import { parse, format } from "date-format-parse";
import { EDataInsertPago } from "../interfaces/facturas.interface";
import { guardarLog } from "./log_provider";

export const getInfoPago = async (codigoPago: string) => {
  const sql = `SELECT
    fin_pago._id AS id_pago
  , fin_pago.codigo
  , fin_pago.descripcion
  , fin_estado_pago.descripcion AS estado_pago
  , fin_estado_pago._id as codigo_estado
  , fin_categoria_pago.descripcion
  , fin_pago.fecha_update
  , fin_detalle_pago.valor_pago
  , fin_detalle_pago.total_pago
  , fin_detalle_pago.valor_iva_pago
  , estado2.descripcion AS estado_detalle
  , fin_detalle_pago.fecha
  , fin_forma_pago._id AS id_forma_pago
  , fin_forma_pago.descripcion AS forma_pago
  , fin_detalle_pago.nombre_banco
  , fin_detalle_pago.codigo_transaccion
  , fin_detalle_pago.ticketID
  , fin_detalle_pago.numero_tarjeta
  , fin_detalle_pago.franquicia
  , fin_detalle_pago.cod_aprobacion
  , fin_detalle_pago.num_recibido
FROM
fin_pago 
  LEFT JOIN   fin_detalle_pago
      ON (fin_detalle_pago.pago_id = fin_pago._id)
  INNER JOIN fin_categoria_pago 
      ON (fin_pago.categoria_pago_id = fin_categoria_pago._id)
  INNER JOIN fin_forma_pago 
      ON (fin_detalle_pago.forma_pago_id = fin_forma_pago._id)
      INNER JOIN  fin_estado_pago AS estado2
      ON (estado2._id = fin_detalle_pago.estado_pago_id)
  INNER JOIN fin_estado_pago 
      ON (fin_pago.estado_id = fin_estado_pago._id) 
              WHERE fin_pago.codigo = ?
              GROUP BY  fin_detalle_pago._id`;
  let result = await conDB.raw(sql, [codigoPago]);
  if (result[0].length > 0) {
    return result[0];
  }
  {
    return false;
  }
};

export const getInfoFactura = async (codigoPago: string) => {
  let sql = `SELECT
fin_pago._id AS pago_id
, fin_pago.codigo
, fin_pago.descripcion
, fin_categoria_pago.descripcion AS categoria_pago
, fin_pago.fecha_update
, fin_detalle_factura._id AS id_detalle_factura
, fin_detalle_factura.pago_id
, fin_detalle_factura.concepto_id
, fin_detalle_factura.descuento
, fin_detalle_factura.aumento
, fin_detalle_factura.valor_unidad
, fin_detalle_factura.cantidad
FROM
fin_pago
INNER JOIN fin_categoria_pago 
    ON (fin_pago.categoria_pago_id = fin_categoria_pago._id)
INNER JOIN fin_detalle_factura 
    ON (fin_detalle_factura.pago_id = fin_pago._id)
 WHERE fin_pago.codigo = ?
 GROUP BY  fin_detalle_factura._id`;
  let result = await conDB.raw(sql, [codigoPago]);
  if (result[0].length > 0) {
    return result[0];
  }
  {
    return false;
  }
};

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
  }
  {
    return false;
  }
};

export const getPagosOnlinePendientes = async (minutos: number) => {
  const sql = `SELECT  
  fin_pago._id AS id_factura,
  fin_pago.codigo,
  fin_pago.fecha,
  fin_pago.is_online,
  fin_pago.estado_id , 
  fin_pago.valor
  FROM fin_pago 

  WHERE  TIMESTAMPDIFF(MINUTE,fin_pago.fecha,NOW()) >= ?
   AND ( fin_pago.is_online='1' OR fin_pago.is_online IS NULL )
and TIMESTAMPDIFF(MONTH ,fin_pago.fecha,NOW()) <=3
  and fin_pago.estado_id <> 1      
  ORDER BY fin_pago.fecha desc
  limit 10
     `;

  let result = await conDB.raw(sql, [minutos]);
  if (result[0].length > 0) {
    return result[0];
  }
  {
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

export const detIdPagoByID = async (id_pago: any) => {
  let result = await conDB.select("_id").from("fin_pago").where("_id", id_pago);
  if (result.length > 0) {
    return result[0]._id;
  } else {
    return false;
  }
};

export const actualizarEstadoPago = async (params: any, id_pago: string) => {
  let result = await conDB("fin_pago").where({ _id: id_pago }).update(params);
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
      "fin_paquete.codigo",
      "fin_paquete.descripcion",
      "fin_paquete.categoria_id",
      "fin_paquete.tipo",
      "fin_detalle_paquete._id",
      "fin_detalle_paquete.concepto_id",
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
  let detalle: any = tDetallePago;
  const trx = await conDB.transaction();
  return await trx("fin_pago")
    .insert(params)
    .then((ids: any) => {
      detalle.forEach((det: any) => (det.pago_id = ids[0]));
      id = ids;

      return trx("fin_detalle_factura").insert(detalle);
    })

    .then((result: any) => {
      trx.commit();
      return id;
    })
    .catch((result: any) => {
      console.log(result);
      trx.rollback();
      return false;
    });
};

//actualiza los datos en fin_pago, borras los detalles de la factura y crea unos nuevos
export const actualizarPagoyDetalleNew = async (
  pago: any,
  det_pago: any,
  pago_id: any
) => {
  // delete pago["codigo"];
  // console.log(det_pago);
  let fechaActual = format(new Date(), "YYYY-MM-DD HH:mm:ss");
  pago.fecha_update = fechaActual;
  const trx = await conDB.transaction();
  return await trx("fin_detalle_factura")
    .where("pago_id", pago_id)
    .del()
    .then((ids: any) => {
      let detalle: any = det_pago;
      return trx("fin_detalle_factura").insert(detalle);
    })

    .then((result: any) => {
      console.log("se va a actualizar el pago");
      console.log(pago);
      return trx("fin_pago")
        .where("_id", pago_id)
        .update(pago)
        .then((result: any) => {
          console.log(pago_id);
          trx.commit();
          let idArreglo = [pago_id, 0];
          return idArreglo;
        });
    })
    .catch((result: any) => {
      console.log(result);
      trx.rollback();
      return false;
    });
};

//si los pagos ya existen realiza un update, de lo contrario un INSERT
export const actualizarPagoyDetalle = async (
  id: number,
  dataInsert: EDataInsertPago[]
) => {
  let comitar = true;
  const trx = await conDB.transaction();
  const result: any[] = await conDB
    .select("_id")
    .from("fin_detalle_pago")
    .where({
      pago_id: id,
    })
    .orderBy("estado_pago_id", "asc");

  try {
    if (result.length > 0 && dataInsert.length > 0) {
      await trx("fin_detalle_pago")
        .where({ pago_id: id })
        .whereRaw("(forma_pago_id <> ? OR  forma_pago_id IS NULL)", [99])
        .del();
    }

    for (const row of dataInsert) {
      await trx("fin_detalle_pago").insert(row);
    }
  } catch (error) {
    comitar = false;
    guardarLog({
      url_service: null,
      json_body: JSON.stringify({"id_pago":id}),
      //'json_response': JSON.stringify(response),
      estado: 0,
      message: error?.message,
      host: null,
    });
    console.log(error);
  }

  if (comitar) {
    await trx.commit();
    console.log("vamos a comitar");
    return true;
  } else {
    await trx.rollback();
    console.log("vamos a desacer cambios");
    return false;
  }
};

//obtiene la configuracion del periodo
//traer la configuracion mas reciente
export const getConfigPeriodo = async () => {
  let result = await conDB
    .select()
    .from("fin_config")
    .where("estado", 1)
    .limit(1)
    .first();
  return result;
};

//obtiene una categoria de porcentaje
export const getCategoriaPorcentaje = async (id: any) => {
  let result = await conDB
    .select()
    .from("fin_porcetaje_categoria")
    .where("_id", id)
    .limit(1)
    .first();
  return result;
};

//obtiene una categoria de porcentaje
export const getCategoriaPorcentajeByMatricula = async (
  cat_pago: any,
  estudiante_id: any,
  periodo_id: any
) => {
  let result = await conDB
    .select(
      "fin_porcentaje_soporte.fecha",
      "fin_porcentaje_soporte.porcentaje",
      "fin_porcentaje_soporte.observacion",
      "fin_porcetaje_categoria.descripcion",
      "fin_porcentaje_estado.descripcion as estado"
    )
    .from("fin_porcentaje_soporte")
    .join(
      "fin_porcetaje_categoria",
      "fin_porcentaje_soporte.porcentaje_categoria_id",
      "=",
      "fin_porcetaje_categoria._id"
    )
    .join(
      "fin_porcentaje_estado",
      "fin_porcentaje_estado._id",
      "=",
      "fin_porcentaje_soporte.porcentaje_estado_id"
    )

    // .where("fin_porcentaje_soporte.matricula_id", cod_matricula);
    .where({
      "fin_porcentaje_soporte.categoria_pago_id": cat_pago,
      "fin_porcentaje_soporte.estudiante_id": estudiante_id,
      "fin_porcentaje_soporte.periodo_id": periodo_id,
    })
    .orderBy([
      { column: "fin_porcentaje_soporte.accion" },
      { column: "fin_porcentaje_soporte.porcentaje_estado_id" },
      { column: "fin_porcentaje_soporte.porcentaje", order: "asc" },
    ]);
  return result;
};

//guarda una solicitud de descuento o aumento
export const guardarProcentajeSoporte = async (data: any) => {
  let result = await conDB("fin_porcentaje_soporte").insert(data);
  return result;
};

//obtiene el detalle de un paquete
export const getPaquete = async (codigo: any) => {
  let sql = `SELECT
  fin_paquete.codigo
  , fin_paquete.descripcion AS paquete
  , fin_paquete.categoria_id
  , fin_concepto.descripcion AS concepto
  , fin_detalle_paquete.valor_unidad
  , fin_detalle_paquete.cantidad
  , fin_detalle_paquete.aumento
  , IF(fin_detalle_paquete.cantidad > 0, SUM( (fin_detalle_paquete.cantidad * fin_detalle_paquete.valor_unidad) + ( (fin_detalle_paquete.cantidad * fin_detalle_paquete.valor_unidad) * fin_detalle_paquete.aumento) -   ( (fin_detalle_paquete.cantidad * fin_detalle_paquete.valor_unidad) * fin_detalle_paquete.descuento) ), fin_detalle_paquete.valor_unidad ) AS subtotal
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
      WHERE fin_paquete.codigo=?
      GROUP BY fin_detalle_paquete._id
      `;

  let result = await conDB.raw(sql, [codigo]);
  if (result[0].length > 0) {
    return result[0];
  } else {
    return false;
  }
};

//consulta descuentos a un estudiante
export const getDescuento = async (
  cat_pago: any,
  periodo_id: any,
  estudiante_id: any
) => {
  let result = await conDB
    .select(
      "fin_porcentaje_soporte._id",
      "fin_porcentaje_soporte.porcentaje",
      "fin_porcentaje_soporte.accion",
      "fin_porcentaje_soporte.observacion",
      "fin_porcentaje_soporte.tipo",
      "fin_porcentaje_soporte.json_file",
      "fin_porcetaje_categoria.descripcion"
    )
    .from("fin_porcentaje_soporte")
    .join(
      "fin_porcetaje_categoria",
      "fin_porcentaje_soporte.porcentaje_categoria_id",
      "=",
      "fin_porcetaje_categoria._id"
    )
    .where({
      categoria_pago_id: cat_pago,
      estudiante_id: estudiante_id,
      periodo_id: periodo_id,
      porcentaje_estado_id: 2,
    })
    .orderBy([
      { column: "fin_porcentaje_soporte.accion" },
      { column: "fin_porcentaje_soporte.porcentaje", order: "asc" },
    ]);
  return result;
};

//cambia el estado del descuento a Facturado para que no se pueda volver a usar
export const updateEstadoDescuentoFac = async (ids: any, pago_id: any) => {
  const trx = await conDB.transaction();

  let dataInsert: any = [];
  ids.forEach((row: any) => {
    let rowDB = {
      pago_id: pago_id,
      porcentaje_soporte_id: row,
    };
    dataInsert.push(rowDB);
  });

  return conDB("fin_porcentaje_soporte")
    .whereIn("_id", ids)
    .update({ porcentaje_estado_id: 4 })

    .then((ress: any) => {
      return trx("fin_factura_descuento").insert(dataInsert);
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

//consulta las categorias de descuento disponibles
export const getCategriaDescuento = async (accion: any) => {
  let result = await conDB
    .select()
    .from("fin_porcetaje_categoria")
    .where({ accion: accion });
  return result;
};

//añade el codigo de barras a un pago ya creado
export const updateCodigoBarras = async (codigo: string, id: number) => {
  return await conDB("fin_pago")
    .where("fin_pago._id", id)
    .update({ codigo_barras: codigo });
};

//actualiza datos de un pago por id
export const updateDataPago = async (data: any, id: number) => {
  return await conDB("fin_pago").where("fin_pago._id", id).update(data);
};

//consulta pago por codigo de barras
export const getPagoByBarCOde = async (codigo: string) => {
  let result = await conDB
    .select()
    .from("fin_pago")
    .where({ codigo_barras: codigo });

  if (result.length > 0) {
    return result[0];
  } else {
    return false;
  }
};

//consulta pago por codigo de barras
export const getPagoByID = async (id: number) => {
  let result = await conDB.select().from("fin_pago").where({ _id: id });

  if (result.length > 0) {
    return result[0];
  } else {
    return false;
  }
};

//verificar si ya se genero un pago antes y no esta pagado
export const existePago = async (cod_paquete: string, matricula_id: string) => {
  let result = await conDB
    .select(
      "fin_pago._id",
      "fin_pago.json_response",
      "fin_pago.codigo",
      "fin_pago.valor",
      "fin_estado_pago.descripcion as estado",
      "fin_estado_pago._id as estado_id"
    )
    .from("fin_pago")
    .join("fin_estado_pago", "fin_pago.estado_id", "=", "fin_estado_pago._id")
    .where({
      "fin_pago.cod_paquete": cod_paquete,
      "fin_pago.matricula_id": matricula_id,
    });

  if (result.length > 0) {
    return result[0];
  } else {
    return false;
  }
};

//verificar si ya se genero un pago antes y no esta pagado
export const existeFactura = async (
  cod_paquete: string,
  matricula_id: string
) => {
  let result = await conDB
    .select(
      "fin_pago._id",
      "fin_pago.json_response",
      "fin_pago.codigo",
      "fin_pago.valor",
      "fin_estado_pago.descripcion as estado",
      "fin_estado_pago._id as estado_id"
    )
    .from("fin_pago")
    .join("fin_estado_pago", "fin_pago.estado_id", "=", "fin_estado_pago._id")
    .where({
      "fin_pago.cod_paquete": cod_paquete,
      "fin_pago.matricula_id": matricula_id,
    });

  if (result.length > 0) {
    return result[0];
  } else {
    return false;
  }
};

//verifica la factura por id trae los conceptos y total a pagar
export const getFactura = async (id_factura: any) => {
  let result = await conDB
    .select(
      "fin_pago._id",
      "fin_pago.codigo",
      "fin_pago.descripcion AS desc_factura",
      "fin_categoria_pago.descripcion as categoria",
      "fin_pago.fecha",
      "fin_pago.estudiante_id",
      "fin_pago.valor",
      "fin_pago.sysapolo_verify",
      "fin_pago.email_send",
      "fin_pago.json_response",
      "fin_detalle_factura.concepto_id",
      "fin_concepto.codigo AS codigo_concepto",
      "fin_concepto.cod_sysapolo",
      "fin_concepto.descripcion AS concepto",
      "fin_detalle_factura.descuento",
      "fin_detalle_factura.aumento",
      "fin_detalle_factura.valor_unidad",
      "fin_detalle_factura.cantidad"
    )
    .from("fin_detalle_factura")
    .join("fin_pago", "fin_detalle_factura.pago_id", "=", " fin_pago._id")
    .join(
      "fin_categoria_pago",
      "fin_pago.categoria_pago_id",
      "=",
      " fin_categoria_pago._id"
    )
    .join(
      "fin_concepto",
      "fin_detalle_factura.concepto_id",
      "=",
      " fin_concepto._id"
    )
    .where({ "fin_pago._id": id_factura });

  if (result.length > 0) {
    return result;
  } else {
    return [];
  }
};

//verifica la factura por id trae los conceptos y total a pagar
export const getFacturaByMatricula = async (
  matricula_id: any,
  cod_paquete: any
) => {
  let result = await conDB
    .select(
      "fin_pago._id",
      "fin_pago.codigo",
      "fin_pago.descripcion AS desc_factura",
      "fin_pago.fecha",
      "fin_pago.estudiante_id",
      "fin_pago.valor",
      "fin_detalle_factura.concepto_id",
      "fin_concepto.codigo AS codigo_concepto",
      "fin_concepto.descripcion AS concepto",
      "fin_detalle_factura.descuento",
      "fin_detalle_factura.aumento",
      "fin_detalle_factura.valor_unidad",
      "fin_detalle_factura.cantidad"
    )
    .from("fin_detalle_factura")
    .join("fin_pago", "fin_detalle_factura.pago_id", "=", " fin_pago._id")
    .join(
      "fin_concepto",
      "fin_detalle_factura.concepto_id",
      "=",
      " fin_concepto._id"
    )
    .where({
      "fin_pago.cod_paquete": cod_paquete,
      "fin_pago.matricula_id": matricula_id,
    })
    .orderBy([
      { column: "fin_pago.fecha", order: "desc" },
    ]);

  if (result.length > 0) {
    return result;
  } else {
    return [];
  }
};

//obtiene los pagos relacionados con una factura con su respectivo estado
export const getPagoFactura = async (id_factura: any): Promise<any[]> => {
  let result = await conDB
    .select(
      "fin_detalle_pago._id",
      "fin_detalle_pago.pago_id",
      "fin_detalle_pago.valor_pago",
      "fin_detalle_pago.total_pago",
      "fin_detalle_pago.estado_pago_id",
      "fin_estado_pago.descripcion AS estado",
      "fin_detalle_pago.forma_pago_id",
      "fin_forma_pago.descripcion AS forma_pago",
      `fin_detalle_pago.fecha`,
      "fin_detalle_pago.nombre_banco",
      "fin_detalle_pago.codigo_transaccion",
      "fin_detalle_pago.ticketID",
      "fin_detalle_pago.numero_tarjeta",
      "fin_detalle_pago.franquicia",
      "fin_detalle_pago.cod_aprobacion",
      "fin_detalle_pago.num_recibido",
      "fin_detalle_pago.int_n_pago"
    )
    .from("fin_detalle_pago")
    .join(
      "fin_estado_pago",
      "fin_detalle_pago.estado_pago_id",
      "=",
      "fin_estado_pago._id"
    )
    .join(
      "fin_forma_pago",
      "fin_detalle_pago.forma_pago_id",
      "=",
      "fin_forma_pago._id"
    )
    .where({
      "fin_detalle_pago.pago_id": id_factura,
      "fin_detalle_pago.estado_pago_id": 1,
    });

  if (result.length > 0) {
    return result;
  } else {
    return [];
  }
};

//obtiene los descuentos aplicados a una factura  con su respectivo estado
export const getDescuentoFactura = async (id_factura: any) => {
  let result = await conDB
    .select(
      "fin_factura_descuento._id",
      "fin_factura_descuento.pago_id",
      "fin_factura_descuento.porcentaje_soporte_id",
      "fin_porcentaje_soporte.fecha",
      "fin_porcentaje_soporte.porcentaje_estado_id",
      "fin_porcentaje_estado.descripcion AS estado",
      "fin_porcentaje_soporte.porcentaje_categoria_id",
      "fin_porcetaje_categoria.descripcion AS categoria",
      "fin_porcentaje_soporte.accion",
      "fin_porcentaje_soporte.porcentaje"
    )
    .from("fin_factura_descuento")
    .join(
      "fin_porcentaje_soporte",
      "fin_factura_descuento.porcentaje_soporte_id",
      "=",
      "fin_porcentaje_soporte._id"
    )
    .join(
      "fin_porcentaje_estado",
      "fin_porcentaje_soporte.porcentaje_estado_id",
      "=",
      "fin_porcentaje_estado._id"
    )
    .join(
      "fin_porcetaje_categoria",
      "fin_porcentaje_soporte.porcentaje_categoria_id",
      "=",
      "fin_porcetaje_categoria._id"
    )
    .where({ "fin_factura_descuento.pago_id": id_factura });

  if (result.length > 0) {
    return result;
  } else {
    return [];
  }
};

//VERIFICADORES
//si los pagos ya existen realiza un update, de lo contrario un INSERT
export const actualizarPagoyDetalleVeri = async (id: any, dataInsert: any) => {
  const trx = await conDB.transaction();
  return await trx("fin_detalle_pago")
    .where({ pago_id: id })
    .whereRaw("(forma_pago_id <> ? OR  forma_pago_id IS NULL)", [99])
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

export const consultaPagosSINNPAGO = async () => {
  let sql = `select _id as pago_id FROM fin_pago      `;

  let result = await conDB.raw(sql);
  if (result[0].length > 0) {
    return result[0];
  } else {
    return [];
  }
};

//actualiza en pago con el email_send cuado se notifica al cliente
export const updateEmailSend = async (id_pago: number) => {
  let result = await conDB("fin_pago").where({ _id: id_pago }).update({
    email_send: "1",
  });
  return result;
};
