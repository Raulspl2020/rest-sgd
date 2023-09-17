import { DetallePago, IDetalleFactura } from "../interfaces/facturas.interface";
import { conDB } from "../config/database";
import {format} from "date-format-parse";
import { calcularSubTotal } from "../helpers/factura.util";

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
    data.forEach((element: IDetalleFactura) => {
      // let total = element.valor_unidad * element.cantidad;
      // let descuento = total * element.descuento;
      // let aumento = total * element.aumento;
      // let subtotal = (total + aumento) - descuento;
      totalFinal = totalFinal + calcularSubTotal(element);
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
export const existeDetPago = async (pago_id: any, valor: number) => {
  let result = await conDB
    .select()
    .from("fin_detalle_pago")
    .where({ pago_id: pago_id, estado_pago_id: 1 })
    .whereRaw("valor_pago >=?", [valor]);
  if (result.length > 0) {
    return result[0];
  } else {
    return false;
  }
};

export const actualizarPagoyDetalle = async (
  id: any,
  pago: any,
  dataInsert: any
) => {
  const trx = await conDB.transaction();
  return await trx("fin_pago")
    .where("fin_pago._id", id)
    .update(pago)
    .then((ids: any) => {
      let detalle: any = dataInsert;
      //TODO: acualizar si existe
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
    .join("fin_detalle_pago", "fin_pago._id", "=", "fin_detalle_pago.pago_id")
    .where(where);

  if (result.length > 0) {
    return result;
  } else {
    return false;
  }
};

//permite corregir los pagos relizados, eliminando los pagos de una factura y creando unos nuevos
export const reversarPagoyDetalle = async (
  id: any,
  pago: any,
  dataInsert: any
) => {
  const trx = await conDB.transaction();
  return await trx("fin_pago")
    .where("fin_pago._id", id)
    .update(pago)
    .then((ids: any) => {
      //eliminar todos los pagos de la factua
      return conDB("fin_detalle_pago")
        .where({
          codigo_transaccion: dataInsert.codigo_transaccion,
          pago_id: dataInsert.pago_id,
          valor_pago: dataInsert.valor_pago,
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

export const consultaFacturaCliente = async (
  id_cliente: any,
  tipo: string = "id_cliente"
) => {
  let auxSql = "";
  if (tipo == "id_cliente") {
    auxSql = " WHERE fin_pago.estudiante_id = ?";
  } else {
    auxSql = " WHERE fin_pago._id = ?";
  }

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
              ${auxSql}
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
  , fin_detalle_pago.int_n_pago
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

export const consultaFacturasPagadas = async (): Promise<any[]> => {
  const fechaActual = new Date();
  const anio = fechaActual.getFullYear();

  let sql = `SELECT
  fin_pago._id AS id_factura,
  fin_pago.fecha AS fecha_factura,
  fin_pago.estudiante_id,
  CONCAT_WS(' ',col_persona.ape1_persona,col_persona.ape2_persona,col_persona.nom1_persona,col_persona.nom2_persona) AS estudiante,
  fin_pago.matricula_id,
  fin_pago.email_send,
  fin_pago.sysapolo_verify,

  tablita.fecha_pago,
  tablita.estado_pago,
  tablita.estado_id,
  ROUND(
    SUM(
      (
        fin_detalle_factura.valor_unidad * fin_detalle_factura.cantidad
      ) - (
        (
          fin_detalle_factura.valor_unidad * fin_detalle_factura.cantidad
        ) * fin_detalle_factura.descuento
      ) + (
        (
          fin_detalle_factura.valor_unidad * fin_detalle_factura.cantidad
        ) * fin_detalle_factura.aumento
      )
    ),
    2
  ) AS total_a_pagar,
  tablita.total_pagado
FROM
  fin_pago
  INNER JOIN fin_detalle_factura

    ON (
      fin_pago._id = fin_detalle_factura.pago_id
    )
      INNER JOIN col_persona
  ON (fin_pago.estudiante_id =  col_persona.ide_persona)
  LEFT JOIN
    (SELECT
      fin_pago._id AS id_factura,
      fin_categoria_pago.descripcion AS categoria,
      fin_categoria_pago._id AS categoria_id,
      fin_detalle_pago._id AS pago_id,
      fin_detalle_pago.int_n_pago,
      fin_detalle_pago.fecha AS fecha_pago,
      fin_estado_pago._id AS estado_id,
      fin_estado_pago.descripcion AS estado_pago,
      fin_forma_pago._id AS forma_pago_id,
      fin_forma_pago.descripcion AS forma_pago,
      fin_pago.json_response AS detalle,
      SUM(
        IF(
          fin_detalle_pago.estado_pago_id = 1,
          fin_detalle_pago.valor_pago,
          0
        )
      ) AS total_pagado
    FROM
      fin_pago
      LEFT JOIN fin_detalle_pago
        ON (
          fin_detalle_pago.pago_id = fin_pago._id
        )
      INNER JOIN fin_estado_pago
        ON (
          fin_detalle_pago.estado_pago_id = fin_estado_pago._id
        )
      LEFT JOIN fin_forma_pago
        ON (
          fin_detalle_pago.forma_pago_id = fin_forma_pago._id
        )
      INNER JOIN fin_categoria_pago
        ON (
          fin_pago.categoria_pago_id = fin_categoria_pago._id
        )
    WHERE fin_detalle_pago.estado_pago_id = 1
    GROUP BY fin_pago._id) AS tablita
    ON (
      fin_pago._id = tablita.id_factura
    )
    
    WHERE tablita.estado_id = 1 AND fin_pago.sysapolo_verify='0' AND  YEAR(tablita.fecha_pago) = ${anio}

GROUP BY fin_pago._id
ORDER BY fin_pago.fecha ASC
LIMIT 10`;

  let result = await conDB.raw(sql);
  if (result[0].length > 0) {
    return result[0];
  } else {
    return [];
  }
};

export const getConceptosByConfigActive = async () => {
  let result = await conDB
    .select(
      "fin_paquete._id AS paquete_id",
      "fin_paquete.descripcion AS paquete",
      "fin_detalle_paquete._id",
      "fin_concepto.codigo",
      "fin_concepto.cod_sysapolo",
      "fin_concepto.descripcion AS concepto",
      "fin_detalle_paquete.concepto_id",
      "fin_detalle_paquete.descuento",
      "fin_detalle_paquete.aumento",
      "fin_detalle_paquete.cantidad",
      "fin_detalle_paquete.valor_unidad",
      "fin_detalle_paquete.descuento_ext"
    )
    .from("fin_detalle_paquete")
    .join(
      "fin_paquete",
      "fin_detalle_paquete.paquete_id",
      "=",
      "fin_paquete._id"
    )
    .join(
      "fin_concepto",
      "fin_detalle_paquete.concepto_id ",
      "=",
      "fin_concepto._id"
    )
    .join("fin_config", "fin_paquete.config_id ", "=", "fin_config._id")

    .where({ "fin_config.estado": "1" })
    .whereNotIn("fin_paquete.codigo", [1, 2, 3, 4, 6])
    .groupBy("fin_detalle_paquete._id");
  return result;
};

//buscar pago
export const existeDetPagoWhere = async (
  pago: DetallePago
): Promise<boolean> => {
  let result = await conDB
    .select()
    .from("fin_detalle_pago")
    .where({
      pago_id: pago.pago_id,
      estado_pago_id: 1,
      codigo_transaccion: pago.codigo_transaccion,
      forma_pago_id: pago.forma_pago_id,
      valor_pago: pago.valor_pago,
    })
    .whereRaw(" DATE(fecha)  =DATE(?)", [pago.fecha]);
  if (result.length > 0) {
    return true;
  } else {
    return false;
  }
};

export const insertPagoMR5 = async (pagos: DetallePago[]): Promise<boolean> => {
  const trx = await conDB.transaction();
  let fechaUpdate = new Date();

  try {
    const resultDB1 = await trx("fin_detalle_pago").insert(pagos);
    let tPago: any = {
      estado_id: 1,
      fecha_update: format(fechaUpdate, "YYYY-MM-DD HH:mm:ss"),
    };

    for (const item of pagos) {
      const resultDB2 = await trx("fin_pago")
        .where("fin_pago._id", item.pago_id)
        .update(tPago);
    }

    trx.commit();
    return true;
  } catch (error) {
    console.log(error);
    trx.rollback();
    return false;
  }
};

//permite eliminar una factura con sus respectivos pagos si esta no tiene pagos pendientes o exitosos

export const eliminarFacturaRef = async (referencia: number) => {
  const trx = await conDB.transaction();

  let eliminarFactura: boolean = true;

  try {
    let result: any = await trx
      .select(
        "fin_pago._id",
        "fin_detalle_pago.valor_pago",
        "fin_detalle_pago.total_pago",
        "fin_pago.estudiante_id",
        "fin_pago.categoria_pago_id",
        "fin_pago.fecha",
        "fin_detalle_pago.estado_pago_id"
      )
      .from("fin_pago")

      .leftJoin(
        "fin_detalle_pago",
        "fin_detalle_pago.pago_id",
        "=",
        "fin_pago._id"
      )
      .where({ "fin_pago._id": referencia })
      .groupBy("fin_detalle_pago._id");

    console.log(result);

    if (result.length > 0) {
      //procedemos a verificar

      result.forEach((element: any) => {
        if (
          element.estado_pago_id == 1 ||
          element.estado_pago_id == 200 ||
          element.estado_pago_id == 888 ||
          element.estado_pago_id == 999 ||
          element.estado_pago_id == 4001 ||
          element.estado_pago_id == 2
        ) {
          eliminarFactura = false;
        }

        if (
          format(element.fecha, "DD-MM-YYYY") ==
          format(new Date(), "DD-MM-YYYY")
        ) {
          throw new Error("No se puede eliminar una factura con fecha de hoy");
        }
      });

      if (eliminarFactura) {
        //procedemos a eliminar
        await trx("fin_pago")
          .where({
            _id: referencia,
          })
          .del();
        trx.commit();
        return [true, "Factura eliminada"];
      } else {
        throw new Error(
          "No se puede eliminar la factura porque contiene pagos pendientes o aprobados"
        );
      }
    } else {
      console.log("No se encontro la factura " + referencia);
      throw new Error("No se encontro la factura " + referencia);
    }
  } catch (error) {
    trx.rollback();
    return [false, error.message];
  }
};
