"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponsePago = exports.ResponsePago = void 0;
class ResponsePago {
    constructor(params) {
        this._int_ped_numero = params.int_ped_numero;
        this._int_n_pago = params.int_n_pago;
        this._int_pago_parcial = params.int_pago_parcial;
        this._int_pago_terminado = params.int_pago_terminado;
        this._int_estado_pago = params.int_estado_pago;
        this._dbl_valor_pagado = params.dbl_valor_pagado;
        this._dbl_total_pago = params.dbl_total_pago;
        this._dbl_valor_iva_pagado = params.dbl_valor_iva_pagado;
        this._str_descripcion = (params.str_descripcion) ? params.str_descripcion : "";
        this._str_id_cliente = (params.str_id_cliente) ? params.str_id_cliente : "";
        this._str_nombre = (params.str_nombre) ? params.str_nombre : "";
        this._str_apellido = (params.str_apellido) ? params.str_apellido : "";
        this._str_telefono = (params.str_telefono) ? params.str_telefono : "";
        this._str_email = (params.str_email) ? params.str_email : "";
        this._str_campo1 = (params.str_campo1) ? params.str_campo1 : "";
        this._str_campo2 = (params.str_campo2) ? params.str_campo2 : "";
        this._str_campo3 = (params.str_campo3) ? params.str_campo3 : "";
        this._str_campo4 = (params.str_campo4) ? params.str_campo4 : "";
        this._str_campo5 = (params.str_campo5) ? params.str_campo5 : "";
        this._dat_fecha = params.dat_fecha;
        this._int_id_forma_pago = params.int_id_forma_pago;
        this._str_ticketID = params.str_ticketID;
        this._int_codigo_servicio = params.int_codigo_servicio;
        this._int_codigo_banco = params.int_codigo_banco;
        this._str_nombre_banco = (params.str_nombre_banco) ? params.str_nombre_banco : "";
        this._str_codigo_transacción = (params.str_codigo_transacción) ? params.str_codigo_transacción : "";
        this._int_ciclo_transacción = params.int_ciclo_transacción;
        this._int_numero_tarjeta = params.int_numero_tarjeta;
        this._str_franquicia = params.str_franquicia;
        this._int_cod_aprobacion = params.int_cod_aprobacion;
        this._int_num_recibido = params.int_num_recibido;
    }
    get int_ped_numero() {
        return this._int_ped_numero;
    }
    get int_n_pago() {
        return this._int_n_pago;
    }
    get int_pago_parcial() {
        return this._int_pago_parcial;
    }
    get int_pago_terminado() {
        return this._int_pago_terminado;
    }
    get int_estado_pago() {
        return this._int_estado_pago;
    }
    get dbl_valor_pagado() {
        return this._dbl_valor_pagado;
    }
    get dbl_total_pago() {
        return this._dbl_total_pago;
    }
    get dbl_valor_iva_pagado() {
        return this._dbl_valor_iva_pagado;
    }
    get str_descripcion() {
        return this._str_descripcion;
    }
    get str_id_cliente() {
        return this._str_id_cliente;
    }
    get str_nombre() {
        return this._str_nombre;
    }
    get str_apellido() {
        return this._str_apellido;
    }
    get str_telefono() {
        return this._str_telefono;
    }
    get str_email() {
        return this._str_email;
    }
    get str_campo1() {
        return this._str_campo1;
    }
    get str_campo2() {
        return this._str_campo2;
    }
    get str_campo3() {
        return this._str_campo3;
    }
    get str_campo4() {
        return this._str_campo4;
    }
    get str_campo5() {
        return this._str_campo5;
    }
    get dat_fecha() {
        return this._dat_fecha;
    }
    get int_id_forma_pago() {
        return this._int_id_forma_pago;
    }
    get str_ticketID() {
        return this._str_ticketID;
    }
    get int_codigo_servicio() {
        return this._int_codigo_servicio;
    }
    get int_codigo_banco() {
        return this._int_codigo_banco;
    }
    get str_nombre_banco() {
        return this._str_nombre_banco;
    }
    get str_codigo_transacción() {
        return this._str_codigo_transacción;
    }
    get int_ciclo_transacción() {
        return this._int_ciclo_transacción;
    }
    get int_numero_tarjeta() {
        return this._int_numero_tarjeta;
    }
    get str_franquicia() {
        return this._str_franquicia;
    }
    get int_cod_aprobacion() {
        return this._int_cod_aprobacion;
    }
    get int_num_recibido() {
        return this._int_num_recibido;
    }
    set int_ped_numero(new_int_ped_numero) {
        this._int_ped_numero = new_int_ped_numero;
    }
    set int_n_pago(new_int_n_pago) {
        this._int_n_pago = new_int_n_pago;
    }
    set int_pago_parcial(new_int_pago_parcial) {
        this._int_pago_parcial = new_int_pago_parcial;
    }
    set int_pago_terminado(new_int_pago_terminado) {
        this._int_pago_terminado = new_int_pago_terminado;
    }
    set int_estado_pago(new_int_estado_pago) {
        this._int_estado_pago = new_int_estado_pago;
    }
    set dbl_valor_pagado(new_dbl_valor_pagado) {
        this._dbl_valor_pagado = new_dbl_valor_pagado;
    }
    set dbl_total_pago(new_dbl_total_pago) {
        this._dbl_total_pago = new_dbl_total_pago;
    }
    set dbl_valor_iva_pagado(new_dbl_valor_iva_pagado) {
        this._dbl_valor_iva_pagado = new_dbl_valor_iva_pagado;
    }
    set str_descripcion(new_str_descripcion) {
        this._str_descripcion = new_str_descripcion;
    }
    set str_id_cliente(new_str_id_cliente) {
        this._str_id_cliente = new_str_id_cliente;
    }
    set str_nombre(new_str_nombre) {
        this._str_nombre = new_str_nombre;
    }
    set str_apellido(new_str_apellido) {
        this._str_apellido = new_str_apellido;
    }
    set str_telefono(new_str_telefono) {
        this._str_telefono = new_str_telefono;
    }
    set str_email(new_str_email) {
        this._str_email = new_str_email;
    }
    set str_campo1(new_str_campo1) {
        this._str_campo1 = new_str_campo1;
    }
    set str_campo2(new_str_campo2) {
        this._str_campo2 = new_str_campo2;
    }
    set str_campo3(new_str_campo3) {
        this._str_campo3 = new_str_campo3;
    }
    set str_campo4(new_str_campo4) {
        this._str_campo4 = new_str_campo4;
    }
    set str_campo5(new_str_campo5) {
        this._str_campo5 = new_str_campo5;
    }
    set dat_fecha(new_dat_fecha) {
        this._dat_fecha = new_dat_fecha;
    }
    set int_id_forma_pago(new_int_id_forma_pago) {
        this._int_id_forma_pago = new_int_id_forma_pago;
    }
    set str_ticketID(new_str_ticketID) {
        this._str_ticketID = new_str_ticketID;
    }
    set int_codigo_servicio(new_int_codigo_servicio) {
        this._int_codigo_servicio = new_int_codigo_servicio;
    }
    set int_codigo_banco(new_int_codigo_banco) {
        this._int_codigo_banco = new_int_codigo_banco;
    }
    set str_nombre_banco(new_str_nombre_banco) {
        this._str_nombre_banco = new_str_nombre_banco;
    }
    set str_codigo_transacción(new_str_codigo_transacción) {
        this._str_codigo_transacción = new_str_codigo_transacción;
    }
    set int_ciclo_transacción(new_int_ciclo_transacción) {
        this._int_ciclo_transacción = new_int_ciclo_transacción;
    }
    set int_numero_tarjeta(new_int_numero_tarjeta) {
        this._int_numero_tarjeta = new_int_numero_tarjeta;
    }
    set str_franquicia(new_str_franquicia) {
        this._str_franquicia = new_str_franquicia;
    }
    set int_cod_aprobacion(new_int_cod_aprobacion) {
        this._int_cod_aprobacion = new_int_cod_aprobacion;
    }
    set int_num_recibido(new_int_num_recibido) {
        this._int_num_recibido = new_int_num_recibido;
    }
    getOjectResponse() {
        return {
            'int_ped_numero': this._int_ped_numero,
            'int_n_pago': this._int_n_pago,
            'int_pago_parcial': this._int_pago_parcial,
            'int_pago_terminado': this._int_pago_terminado,
            'int_estado_pago': this._int_estado_pago,
            'dbl_valor_pagado': this._dbl_valor_pagado,
            'dbl_total_pago': this._dbl_total_pago,
            'dbl_valor_iva_pagado': this._dbl_valor_iva_pagado,
            'str_descripcion': this._str_descripcion,
            'str_id_cliente': this._str_id_cliente,
            'str_nombre': this._str_nombre,
            'str_apellido': this._str_apellido,
            'str_telefono': this._str_telefono,
            'str_email': this._str_email,
            'str_campo1': this._str_campo1,
            'str_campo2': this._str_campo2,
            'str_campo3': this._str_campo3,
            'str_campo4': this._str_campo4,
            'str_campo5': this._str_campo5,
            'dat_fecha': this._dat_fecha,
            'int_id_forma_pago': this._int_id_forma_pago,
            'str_ticketID': (this._str_ticketID) ? this._str_ticketID : null,
            'int_codigo_servicio': (this._int_codigo_servicio) ? this._int_codigo_servicio : null,
            'int_codigo_banco': (this._int_codigo_banco) ? this._int_codigo_banco : null,
            'str_nombre_banco': (this._str_nombre_banco) ? this._str_nombre_banco : null,
            'str_codigo_transacción': (this._str_codigo_transacción) ? this._str_codigo_transacción : null,
            'int_ciclo_transacción': (this._int_ciclo_transacción) ? this._int_ciclo_transacción : null,
            'int_numero_tarjeta': (this._int_numero_tarjeta) ? this._int_numero_tarjeta : null,
            'str_franquicia': (this._str_franquicia) ? this._str_franquicia : null,
            'int_cod_aprobacion': (this._int_cod_aprobacion) ? this._int_cod_aprobacion : null,
            'int_num_recibido': (this._int_num_recibido) ? this._int_num_recibido : null
        };
    }
}
exports.ResponsePago = ResponsePago;
class ListResponsePago {
    constructor() {
        this.decodePagoToList = (cadena) => {
            let datos = cadena.split("|");
            let row = [];
            let matriz = [];
            datos.forEach(element => {
                if ((element.trim().indexOf(';') != -1)) {
                    matriz.push(row);
                    row = [];
                    let aux = element.trim().split(' ');
                    if (aux.length > 1) {
                        row.push(aux[1]);
                    }
                    else {
                        row.push("");
                    }
                }
                else {
                    row.push(element.trim());
                }
            });
            let listapagos = [];
            matriz.forEach(dato => {
                let responsePago = new ResponsePago({});
                responsePago.int_ped_numero = dato[0];
                responsePago.int_n_pago = dato[1];
                responsePago.int_pago_parcial = dato[2];
                responsePago.int_pago_terminado = dato[3];
                responsePago.int_estado_pago = dato[4];
                responsePago.dbl_valor_pagado = dato[5];
                responsePago.dbl_total_pago = dato[6];
                responsePago.dbl_valor_iva_pagado = dato[7];
                responsePago.str_descripcion = dato[8];
                responsePago.str_id_cliente = dato[9];
                responsePago.str_nombre = dato[10];
                responsePago.str_apellido = dato[11];
                responsePago.str_telefono = dato[12];
                responsePago.str_email = dato[13];
                responsePago.str_campo1 = dato[14];
                responsePago.str_campo2 = dato[15];
                responsePago.str_campo3 = dato[16];
                responsePago.str_campo4 = dato[17];
                responsePago.str_campo5 = dato[18];
                responsePago.dat_fecha = dato[19];
                responsePago.int_id_forma_pago = dato[20];
                if (dato[20] == 29) {
                    responsePago.str_ticketID = dato[21];
                    responsePago.int_codigo_servicio = dato[22];
                    responsePago.int_codigo_banco = dato[23];
                    responsePago.str_nombre_banco = dato[24];
                    responsePago.str_codigo_transacción = dato[25];
                    responsePago.int_ciclo_transacción = dato[26];
                }
                if (dato[20] == 32) {
                    responsePago.str_ticketID = dato[21];
                    responsePago.int_numero_tarjeta = dato[22];
                    responsePago.str_franquicia = dato[23];
                    responsePago.int_cod_aprobacion = dato[24];
                    responsePago.int_num_recibido = dato[25];
                }
                listapagos.push(responsePago.getOjectResponse());
            });
            return listapagos;
        };
    }
}
exports.ListResponsePago = ListResponsePago;
//# sourceMappingURL=ResponsePago.js.map