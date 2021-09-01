export interface  FacturaSysApolo {

    ide_fact_concepto_enc: number,
    num_recibo: number,
    fec_recibo: string,
    cod_ter: string,
    ide_usuario: number,
    det_recibo: string,
    valor_concepto: number,
    valor_recaudo: number,
    cod_punto_pago: number,
    pagado: string,
    ide_banco: number,
    cod_colegio: number,
    cod_forma_pago: number,
    cod_nivel_educativo: number

}


export interface FacturaDetalleSysApolo {
    ide_fact_concepto_det: number,
    ide_fact_concepto_enc: number,
    ide_concepto: number,
    cantidad: number,
    valor_concepto: number,
    sub_total: number,
    ide_contabilidad_debito_causacion: number, //-1
    ide_contabilidad_credito_causacion: number, //-1
    ide_encabezado_contabilidad_causacion: number, //-1
    ide_contabilidad_debito_recaudo: number, //-1
    ide_contabilidad_credito_recaudo: number, //-1
    ide_encabezado_contabilidad_recaudo: number, //-1
    ide_presupuesto_recurso: number, //-1
    cod_centro_costo_deb_causacion: number, //-1
    cod_centro_costo_cre_causacion: number, //-1
    cod_centro_costo_deb_recaudo: number, //-1
    cod_centro_costo_cre_recaudo: number //-1
}