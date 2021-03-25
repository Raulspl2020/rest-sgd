"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarPagoyDetalle = exports.guardarPagoyDetalle = exports.getConceptosPaquete = exports.getConceptos = exports.actualizarEstadoPago = exports.detIdPagoByCodigo = exports.obtenerPagosPendientes = exports.guardarPago = void 0;
const database_1 = require("../config/database");
exports.guardarPago = (params) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB("fin_pago").insert(params);
    return result;
});
//Usado por las tareas cron para verificar los pagos cada cierto tiempo
exports.obtenerPagosPendientes = (minutos, forma_pago_ids) => __awaiter(void 0, void 0, void 0, function* () {
    const sql = `SELECT  fin_pago._id, fin_pago.codigo FROM 
    fin_pago LEFT JOIN fin_detalle_pago ON (fin_pago._id = fin_detalle_pago.pago_id)
    WHERE (fin_detalle_pago.estado_pago_id = 999 OR fin_pago.estado_id=4001)
    AND TIMESTAMPDIFF(MINUTE,fin_pago.fecha,NOW()) >= ?
    AND fin_detalle_pago.forma_pago_id IN (?)`;
    let result = yield database_1.conDB.raw(sql, [minutos, forma_pago_ids]);
    return result;
});
exports.detIdPagoByCodigo = (codigo) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB
        .select("_id")
        .from("fin_pago")
        .where("codigo", codigo);
    if (result.length > 0) {
        return result[0]._id;
    }
    else {
        return false;
    }
});
exports.actualizarEstadoPago = (params, codigo) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB("fin_pago").where("codigo", codigo).update(params);
    return result;
});
exports.getConceptos = (ids) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB
        .select("_id", "codigo", "descripcion", "valor")
        .from("fin_concepto")
        .whereIn("_id", ids);
    return result;
});
exports.getConceptosPaquete = (id) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield database_1.conDB("fin_paquete")
        .join("fin_detalle_paquete", "fin_paquete._id", "=", "fin_detalle_paquete.paquete_id")
        .select("fin_paquete._id", "fin_paquete.descripcion", "fin_paquete.categoria_id", "fin_paquete.tipo", "fin_detalle_paquete._id", "fin_detalle_paquete.valor_unidad", "fin_detalle_paquete.cantidad", "fin_detalle_paquete.descuento", "fin_detalle_paquete.aumento")
        .where("fin_paquete._id", id);
    return result;
});
exports.guardarPagoyDetalle = (params, tDetallePago) => __awaiter(void 0, void 0, void 0, function* () {
    let id = 0;
    const trx = yield database_1.conDB.transaction();
    return yield trx("fin_pago")
        .insert(params)
        .then((ids) => {
        let detalle = tDetallePago;
        detalle.forEach((det) => (det.pago_id = ids[0]));
        id = ids;
        return trx("fin_detalle_factura").insert(detalle);
    })
        .then((result) => {
        trx.commit();
        return id;
    })
        .catch((result) => {
        trx.rollback();
        return false;
    });
});
exports.actualizarPagoyDetalle = (id, dataInsert) => __awaiter(void 0, void 0, void 0, function* () {
    const trx = yield database_1.conDB.transaction();
    return yield trx("fin_detalle_pago")
        .where("pago_id", id)
        .del()
        .then((ids) => {
        let detalle = dataInsert;
        return trx("fin_detalle_pago").insert(detalle);
    })
        .then((result) => {
        trx.commit();
        return true;
    })
        .catch((result) => {
        console.log(result);
        trx.rollback();
        return false;
    });
});
//# sourceMappingURL=pago_provider.js.map