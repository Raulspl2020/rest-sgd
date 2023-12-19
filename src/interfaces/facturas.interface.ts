export interface FacturaSysApolo {
  ide_fact_concepto_enc: number;
  num_recibo: number;
  fec_recibo: string;
  cod_ter: string;
  ide_usuario: number;
  det_recibo: string;
  valor_concepto: number;
  valor_recaudo: number;
  cod_punto_pago: number;
  pagado: string;
  ide_banco: number;
  cod_colegio: number;
  cod_forma_pago: number;
  cod_nivel_educativo: number;
  crea_registro: number;
}

export interface FacturaDetalleSysApolo {
  ide_fact_concepto_det?: number;
  ide_fact_concepto_enc?: number;
  ide_concepto: number;
  cantidad: number;
  valor_concepto: number;
  sub_total: number;
  ide_contabilidad_debito_causacion?: number; //-1
  ide_contabilidad_credito_causacion?: number; //-1
  ide_encabezado_contabilidad_causacion?: number; //-1
  ide_contabilidad_debito_recaudo?: number; //-1
  ide_contabilidad_credito_recaudo?: number; //-1
  ide_encabezado_contabilidad_recaudo?: number; //-1
  ide_presupuesto_recurso?: number; //-1
  cod_centro_costo_deb_causacion?: number; //-1
  cod_centro_costo_cre_causacion?: number; //-1
  cod_centro_costo_deb_recaudo?: number; //-1
  cod_centro_costo_cre_recaudo?: number; //-1
}

//sigedin
export interface DetallePago {
  _id?: string;
  pago_id?: number;
  valor_pago?: number;
  total_pago?: number;
  fecha?: string;
  estado_pago_id?: number;
  forma_pago_id?: number;
  codigo_transaccion?: number;
  banco_recaudo_id?: number;
  tipo_registro?: string;
}

export interface IDetalleFactura {
  cantidad: number;
  valor_unidad: number;
  aumento: number;
  descuento: number;
  concepto_id: number;
}

export interface ITotales {
  totalExtraordinario: number;
  totalOrdinario: number;
}

export interface EDataInsertPago {
  _id: string;
  cod_aprobacion: string | null;
  codigo_transaccion: string | null;
  estado_pago_id: string | null;
  fecha: string;
  forma_pago_id: string;
  franquicia: null | string;
  int_n_pago: string | null;
  nombre_banco: string | null;
  num_recibido: null;
  numero_tarjeta: null;
  pago_id: number;
  ticketID: string | null;
  total_pago: string | null;
  valor_iva_pago: string | null;
  valor_pago: string | null;
}

export enum ECategoryInvoice {
  OTROS = 0,
  MATRICULA = 1,
  HABILITACIONES_SUPLETORIOS = 4,
  INSCRIPCION = 5,
  REINGRESO = 6,
  CREDITO_ADICIONAL = 7,
  GRADO = 8,
  CERTIFICADOS_CONSTANCIAS = 9,
  HOMOLOGACIONES = 10,
  CARNET_INSTITUCIONAL = 11,
  ESPECIALIZACIONES = 12,
}
