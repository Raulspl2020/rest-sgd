"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pago = void 0;
class Pago {
    constructor(param) {
        this.flt_total_con_iva = param.flt_total_con_iva;
        this.flt_valor_iva = param.flt_valor_iva;
        this.str_id_pago = param.str_id_pago;
        this.str_descripcion_pago = param.str_descripcion_pago;
        this.str_email = param.str_email;
        this.str_id_cliente = param.str_id_cliente;
        this.str_tipo_id = param.str_tipo_id;
        this.str_nombre_cliente = param.str_nombre_cliente;
        this.str_apellido_cliente = param.str_apellido_cliente;
        this.str_telefono_cliente = param.str_telefono_cliente;
        this.str_opcional1 = param.str_opcional1 ? param.str_opcional1 : "";
        this.str_opcional2 = param.str_opcional2 ? param.str_opcional2 : "";
        this.str_opcional3 = param.str_opcional3 ? param.str_opcional3 : "";
        this.str_opcional4 = param.str_opcional4 ? param.str_opcional4 : "";
        this.str_opcional5 = param.str_opcional5 ? param.str_opcional5 : "";
    }
}
exports.Pago = Pago;
//# sourceMappingURL=Pago.js.map