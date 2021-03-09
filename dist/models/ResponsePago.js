"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponsePago = void 0;
class ResponsePago {
    constructor(params) {
        this.int_ped_numero = params.int_ped_numero;
        this.int_n_pago = params.int_n_pago;
        this.int_pago_parcial = params.int_pago_parcial;
        this.int_pago_terminado = params.int_pago_terminado;
        this.int_estado_pago = params.int_estado_pago;
        this.dbl_valor_pagado = params.dbl_valor_pagado;
        this.dbl_total_pago = params.dbl_total_pago;
        this.dbl_valor_iva_pagado = params.dbl_valor_iva_pagado;
        this.str_descripcion = (params.str_descripcion) ? params.str_descripcion : "";
        this.str_id_cliente = (params.str_id_cliente) ? params.str_id_cliente : "";
        this.str_nombre = (params.str_nombre) ? params.str_nombre : "";
        this.str_apellido = (params.str_apellido) ? params.str_apellido : "";
        this.str_telefono = (params.str_telefono) ? params.str_telefono : "";
        this.str_email = (params.str_email) ? params.str_email : "";
        this.str_campo1 = (params.str_campo1) ? params.str_campo1 : "";
        this.str_campo2 = (params.str_campo2) ? params.str_campo2 : "";
        this.str_campo3 = (params.str_campo3) ? params.str_campo3 : "";
        this.str_campo4 = (params.str_campo4) ? params.str_campo4 : "";
        this.str_campo5 = (params.str_campo5) ? params.str_campo5 : "";
        this.dat_fecha = params.dat_fecha;
        this.int_id_forma_pago = params.int_id_forma_pago;
        this.str_ticketID = params.str_ticketID;
        this.int_codigo_servicio = params.int_codigo_servicio;
        this.int_codigo_banco = params.int_codigo_banco;
        this.str_nombre_banco = (params.str_nombre_banco) ? params.str_nombre_banco : "";
        this.str_codigo_transacción = (params.str_codigo_transacción) ? params.str_codigo_transacción : "";
        this.int_ciclo_transacción = params.int_ciclo_transacción;
    }
}
exports.ResponsePago = ResponsePago;
//# sourceMappingURL=ResponsePago.js.map