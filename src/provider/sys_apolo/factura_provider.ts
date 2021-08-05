import { conDB } from "../../config/database";

//verifica si un usuario con token tiene permiso para consumir el servicio
export const syslistarFacturasPagadas = async () => {
    let result = await conDB
        .select(
            'fin_pago._id AS id'
            , 'fin_pago.codigo'
            , 'fin_pago.descripcion AS desc_factura'
            , 'fin_pago.json_response'
            , 'fin_pago.fecha AS fecha'
            , 'fin_detalle_pago.estado_pago_id'
            , 'fin_estado_pago.descripcion AS estado_pago'
            , 'fin_detalle_pago.forma_pago_id'
            , 'fin_forma_pago.descripcion AS forma_pago'
            , 'fin_detalle_pago.total_pago'
            , 'fin_detalle_pago.valor_pago'
            , 'fin_detalle_pago.int_n_pago'
            , 'fin_detalle_pago.fecha AS fecha_pago'
            , 'fin_detalle_pago.nombre_banco'
            , 'fin_detalle_pago.codigo_transaccion'
            , 'fin_detalle_pago.ticketID'
            , 'fin_detalle_pago.numero_tarjeta'
            , 'fin_detalle_pago.franquicia'
            , 'fin_detalle_pago.cod_aprobacion'
            , 'fin_detalle_factura.concepto_id'
            , 'fin_concepto.descripcion AS concepto'
            , 'fin_concepto.cod_sysapolo AS cod_concepto_sys'
            , 'fin_detalle_factura.descuento'
            , 'fin_detalle_factura.aumento'
            , 'fin_detalle_factura.valor_unidad'
            , 'fin_detalle_factura.cantidad'
            , 'fin_pago.sysapolo_verify'
        )
        .from("fin_detalle_pago")
        .join("fin_pago", "fin_detalle_pago.pago_id", "=", "fin_pago._id")
        .join("fin_forma_pago", "fin_detalle_pago.forma_pago_id", "=", "fin_forma_pago._id")
        .join("fin_estado_pago", "fin_detalle_pago.estado_pago_id", "=", "fin_estado_pago._id")
        .join("fin_detalle_factura", "fin_detalle_factura.pago_id", "=", "fin_pago._id")
        .join("fin_concepto", "fin_detalle_factura.concepto_id", "=", "fin_concepto._id")
        .where({ 'fin_detalle_pago.estado_pago_id': 1, 'fin_pago.sysapolo_verify': '0' })
        .groupBy('fin_detalle_factura._id')
        .orderBy('fin_pago._id', 'ASC')
        .limit(50);
    return result;
};


