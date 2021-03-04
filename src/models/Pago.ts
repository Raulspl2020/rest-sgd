interface Pago {

    flt_total_con_iva: number;
    flt_valor_iva: number;
    str_id_pago: string;
    str_descripcion_pago: string;
    str_email: string;
    str_id_cliente: string;
    str_tipo_id: string;
    str_nombre_cliente: string;
    str_apellido_cliente: string;
    str_telefono_cliente: string;
    str_opcional1?: string;
    str_opcional2?: string;
    str_opcional3?: string;
    str_opcional4?: string;
    str_opcional5?: string;
}
export {
    Pago
}