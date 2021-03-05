class Pago {

   private flt_total_con_iva: number;
   private flt_valor_iva: number;
   private str_id_pago: string;
   private str_descripcion_pago: string;
   private str_email: string;
   private str_id_cliente: string;
   private str_tipo_id: string;
   private str_nombre_cliente: string;
   private str_apellido_cliente: string;
   private str_telefono_cliente: string;
   private str_opcional1?: string;
   private str_opcional2?: string;
   private str_opcional3?: string;
   private str_opcional4: string ;
   private str_opcional5: string;
    
   constructor(param:any){
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
    this.str_opcional1 =  (param.str_opcional1) ? param.str_opcional1 : "";
    this.str_opcional2 = (param.str_opcional2) ? param.str_opcional2 : "";
    this.str_opcional3 = (param.str_opcional3) ? param.str_opcional3 : "";
    this.str_opcional4 = (param.str_opcional4) ? param.str_opcional4 : "";
    this.str_opcional5 =  (param.str_opcional5) ? param.str_opcional5 : "";
   }
   
}
export {
    Pago
}