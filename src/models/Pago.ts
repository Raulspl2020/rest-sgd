class Pago {
  public flt_total_con_iva: number;
  public flt_valor_iva: number;
  public str_id_pago: string;
  public str_descripcion_pago: string;
  public str_email: string;
  public str_id_cliente: string;
  public str_tipo_id: string;
  public str_nombre_cliente: string;
  public str_apellido_cliente: string;
  public str_telefono_cliente: string;
  public str_opcional1?: string;
  public str_opcional2?: string;
  public str_opcional3?: string;
  public str_opcional4: string;
  public str_opcional5: string;

  constructor(param: any) {
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


//  get flt_total_con_iva(): number {
//      return this._flt_total_con_iva;
//  }
//  get flt_valor_iva(): number {
//      return this._flt_valor_iva;
//  }
//  get str_id_pago(): string {
//      return this._str_id_pago;
//  }
//  get str_descripcion_pago(): string {
//      return this._str_descripcion_pago;
//  }
//  get str_email(): string {
//      return this._str_email;
//  }
//  get str_id_cliente(): string {
//      return this._str_id_cliente;
//  }
//  get str_tipo_id(): string {
//      return this._str_tipo_id;
//  }
//  get str_nombre_cliente(): string {
//      return this._str_nombre_cliente;
//  }
//  get str_apellido_cliente(): string {
//      return this._str_apellido_cliente;
//  }
//  get str_telefono_cliente(): string {
//      return this._str_telefono_cliente;
//  }
//  get str_opcional1(): string {
//      return this._str_opcional1;
//  }
//  get str_opcional2(): string {
//      return this._str_opcional2;
//  }
//  get str_opcional3(): string {
//      return this._str_opcional3;
//  }
//  get str_opcional4(): string {
//      return this._str_opcional4;
//  }
//  get str_opcional5(): string {
//      return this._str_opcional5;
//  }



// set flt_total_con_iva(value:number){
//     this.flt_total_con_iva = value;
// }
// set flt_valor_iva(value:number){
//     this.flt_valor_iva = value;
// }
// set str_id_pago(value:string){
//     console.log("cambiando del nuevo valor");
//     this.str_id_pago = value;
// }
// set str_descripcion_pago(value:string){
//     this.str_descripcion_pago = value.toUpperCase();
// }
// set str_email(value:string){
//     this.str_email = value;
// }
// set str_id_cliente(value:string){
//     this.str_id_cliente = value;
// }
// set str_tipo_id(value:string){
//     this.str_tipo_id = value;
// }
// set str_nombre_cliente(value:string){
//     this.str_nombre_cliente = value.toUpperCase();
// }
// set str_apellido_cliente(value:string){
//     this.str_apellido_cliente = value.toUpperCase();
// }
// set str_telefono_cliente(value:string){
//     this.str_telefono_cliente = value;
// }
// set str_opcional1(value:string){
//     this.str_opcional1 = value;
// }
// set str_opcional2(value:string){
//     this.str_opcional2 = value;
// }
// set str_opcional3(value:string){
//     this.str_opcional3 = value;
// }
// set str_opcional4(value:string){
//     this.str_opcional4 = value;
// }
// set str_opcional5(value:string){
//     this.str_opcional5 = value;
// }



}
export { Pago };
