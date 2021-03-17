class ResponsePago {
    private int_ped_numero: number;
    private int_n_pago: number;
    private int_pago_parcial: number;
    public int_pago_terminado: number;
    private int_estado_pago: number;
    private dbl_valor_pagado: number;
    private dbl_total_pago: number;
    private dbl_valor_iva_pagado: number;
    private str_descripcion: string;
    private str_id_cliente: string;
    private str_nombre: string;
    private str_apellido: string;
    private str_telefono: string;
    private str_email: string;
    private str_campo1: string;
    private str_campo2: string;
    private str_campo3: string;
    private str_campo4: string;
    private str_campo5: string;
    private dat_fecha: string;
    private int_id_forma_pago: string;

    //si el medio de pago es 29
    private str_ticketID: string;
    private int_codigo_servicio: number;
    private int_codigo_banco: number;
    private str_nombre_banco: string;
    private str_codigo_transacción: string;
    private int_ciclo_transacción: number;

    //si el medio de pago es 32
    //private str_ticketID : string;
    private _int_numero_tarjeta: number;
    private _str_franquicia: string;
    private _int_cod_aprobacion: string;
    private _int_num_recibido: string;


    constructor(params: any) {
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


    get int_numero_tarjeta(): number {
        return this._int_numero_tarjeta;
    }
    get str_franquicia(): string {
        return this._str_franquicia;
    }
    get int_cod_aprobacion(): string {
        return this._int_cod_aprobacion;
    }
    get int_num_recibido(): string {
        return this._int_num_recibido;
    }


    set int_numero_tarjeta(new_int_numero_tarjeta: number){
        this._int_numero_tarjeta = new_int_numero_tarjeta;
    }
    set str_franquicia(new_str_franquicia: string){
        this._str_franquicia = new_str_franquicia;
    }
    set int_cod_aprobacion(new_int_cod_aprobacion: string){
        this._int_cod_aprobacion = new_int_cod_aprobacion;
    }
    set int_num_recibido(new_int_num_recibido: string){
        this._int_num_recibido = new_int_num_recibido;
    }






}

export {
    ResponsePago
}