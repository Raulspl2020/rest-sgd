import { conDB, conSysApolo } from "../../config/database";
import { Int, Transaction, Request, VarChar } from "mssql";
const sql = require("mssql");
import { FacturaSysApolo } from "../../interfaces/facturas.interface";
import { FacturaDetalleSysApolo } from "../../interfaces/facturas.interface";
import { query } from "express-validator";

//verifica si un usuario con token tiene permiso para consumir el servicio
export const syslistarFacturasPagadas = async () => {
    let result = await conDB
        .select(
            'fin_pago._id AS id'
            , 'fin_pago.codigo'
            , 'fin_pago.descripcion AS desc_factura'
            , 'fin_pago.json_response'
            , 'fin_pago.fecha AS fecha'
            , 'fin_detalle_pago.estado_pago_id'
            , 'fin_estado_pago.descripcion AS estado_pago'
            , 'fin_detalle_pago.forma_pago_id'
            , 'fin_forma_pago.descripcion AS forma_pago'
            , 'fin_detalle_pago.total_pago'
            , 'fin_detalle_pago.valor_pago'
            , 'fin_detalle_pago.int_n_pago'
            , 'fin_detalle_pago.fecha AS fecha_pago'
            , 'fin_detalle_pago.nombre_banco'
            , 'fin_detalle_pago.codigo_transaccion'
            , 'fin_detalle_pago.ticketID'
            , 'fin_detalle_pago.numero_tarjeta'
            , 'fin_detalle_pago.franquicia'
            , 'fin_detalle_pago.cod_aprobacion'
            , 'fin_detalle_factura.concepto_id'
            , 'fin_concepto.descripcion AS concepto'
            , 'fin_concepto.cod_sysapolo AS cod_concepto_sys'
            , 'fin_detalle_factura.descuento'
            , 'fin_detalle_factura.aumento'
            , 'fin_detalle_factura.valor_unidad'
            , 'fin_detalle_factura.cantidad'
            , 'fin_pago.sysapolo_verify'
        )
        .from("fin_detalle_pago")
        .join("fin_pago", "fin_detalle_pago.pago_id", "=", "fin_pago._id")
        .join("fin_forma_pago", "fin_detalle_pago.forma_pago_id", "=", "fin_forma_pago._id")
        .join("fin_estado_pago", "fin_detalle_pago.estado_pago_id", "=", "fin_estado_pago._id")
        .join("fin_detalle_factura", "fin_detalle_factura.pago_id", "=", "fin_pago._id")
        .join("fin_concepto", "fin_detalle_factura.concepto_id", "=", "fin_concepto._id")
        .where({ 'fin_detalle_pago.estado_pago_id': 1, 'fin_pago.sysapolo_verify': '0' })
        .groupBy('fin_detalle_factura._id')
        .orderBy('fin_pago._id', 'ASC')
        .limit(49);
    return result;
};


//cambia el estado (sysaplo_verify: 0 | 1) de la factura cuando ésta ya fue registrada en sysapolo
export const sysregistrarFacturasPagadas = async (ids: number[]): Promise<boolean> => {
    const trx = await conDB.transaction();
    return await trx("fin_pago")
        .whereIn("fin_pago._id", ids)
        .update({ "sysapolo_verify": '1' })
        .then((result: any) => {
            trx.commit();
            return true;
        })
        .catch((result: any) => {
            console.log(result);
            trx.rollback();
            return false;
        });

}



//obtiene una factura pagada por id que no se han verificado
export const sysGetFacturaPagadaByID = async (id_factura: number) => {
    let result = await conDB
        .select(
            'fin_pago._id AS id'
            , 'fin_pago.codigo'
            , 'fin_pago.descripcion AS desc_factura'
            , 'fin_pago.json_response'
            , 'fin_pago.fecha AS fecha'
            , 'fin_detalle_pago.estado_pago_id'
            , 'fin_estado_pago.descripcion AS estado_pago'
            , 'fin_detalle_pago.forma_pago_id'
            , 'fin_forma_pago.descripcion AS forma_pago'
            , 'fin_detalle_pago.total_pago'
            , 'fin_detalle_pago.valor_pago'
            , 'fin_detalle_pago.int_n_pago'
            , 'fin_detalle_pago.fecha AS fecha_pago'
            , 'fin_detalle_pago.nombre_banco'
            , 'fin_detalle_pago.codigo_transaccion'
            , 'fin_detalle_pago.ticketID'
            , 'fin_detalle_pago.numero_tarjeta'
            , 'fin_detalle_pago.franquicia'
            , 'fin_detalle_pago.cod_aprobacion'
            , 'fin_detalle_factura.concepto_id'
            , 'fin_concepto.descripcion AS concepto'
            , 'fin_concepto.cod_sysapolo AS cod_concepto_sys'
            , 'fin_detalle_factura.descuento'
            , 'fin_detalle_factura.aumento'
            , 'fin_detalle_factura.valor_unidad'
            , 'fin_detalle_factura.cantidad'
            , 'fin_detalle_pago.banco_recaudo_id'
            , 'fin_pago.sysapolo_verify'
            , 'fin_categoria_pago.descripcion as categoria'
            , 'fin_banco_recaudo.cuenta_banco'
            , 'fin_banco_recaudo.descripcion as punto_pago'
        )
        .from("fin_detalle_pago")
        .join("fin_pago", "fin_detalle_pago.pago_id", "=", "fin_pago._id")
        .join("fin_forma_pago", "fin_detalle_pago.forma_pago_id", "=", "fin_forma_pago._id")
        .join("fin_estado_pago", "fin_detalle_pago.estado_pago_id", "=", "fin_estado_pago._id")
        .join("fin_detalle_factura", "fin_detalle_factura.pago_id", "=", "fin_pago._id")
        .join("fin_concepto", "fin_detalle_factura.concepto_id", "=", "fin_concepto._id")
        .join("fin_categoria_pago", "fin_pago.categoria_pago_id", "=", "fin_categoria_pago._id")
        .join("fin_banco_recaudo", "fin_banco_recaudo._id", "=", "fin_detalle_pago.banco_recaudo_id")
        .where({ 'fin_detalle_pago.estado_pago_id': 1, 'fin_pago._id': id_factura })
        .groupBy('fin_detalle_factura._id')
        .orderBy('fin_pago._id', 'ASC');
    return result;
};



// metodos usados para obtener informacion de la base de datos de sysapolo


//consulta el punto de pago actual teniendo en cuenta la cuenta bancaria donde llega el dinero
export const consultarPuntoPago = async (anio: number, cuenta: string) => {
    const pool = await conSysApolo();
    let result1 = await pool.request()
        .input('anio', Int, anio)
        .input('cuenta', VarChar(30), cuenta)
        .query('select * from vup_punto_pago where num_cuenta_banco = @cuenta and anno_punto_pago = @anio  order by cod_punto_pago desc')
    return result1.recordset;
}







//verifica si existe una factura en sysApolo
export const consultarFacturaByID = async (id: number) => {
    const pool = await conSysApolo();
    let result1 = await pool.request()
        .input('id', Int, id)
        .query('select * from vup_fact_concepto_escolar_encabezado where num_recibo = @id')
    return result1.recordset;
}


//permite consultal el consecutivo de la factura para crear
export const getCodFactura = async () => {
    const cnn = await conSysApolo();
    let pool = await cnn;
    let result = await pool.request().query(`SELECT cod_factura = COALESCE(MAX(REPLACE(STR(ide_fact_concepto_enc+1, 5), SPACE(1), '0')),1) FROM vup_fact_concepto_escolar_encabezado`);
    return result.recordset[0];
}


//permite consultal el consecutivo de la factura para crear
export const getCodDetFac = async () => {
    const cnn = await conSysApolo();
    let pool = await cnn;
    let result = await pool.request().query(`SELECT cod_det_factura = COALESCE(MAX(REPLACE(STR(ide_fact_concepto_det, 5), SPACE(1), '0')),0) FROM vup_fact_concepto_escolar_detalle`);
    return result.recordset[0];
}




//permite crear un tercero en sysapolo
export const createReciboPago = async (encabezado: FacturaSysApolo, detalle: FacturaDetalleSysApolo[]) => {
    let { cod_det_factura } = await getCodDetFac();
    const cnn = await conSysApolo();


    return new Promise((resolve, reject) => {
        let transaction = new sql.Transaction(cnn);
        const query1: string = `INSERT INTO vup_fact_concepto_escolar_encabezado (
            ide_fact_concepto_enc,
            num_recibo,
            fec_recibo,
            cod_ter,
            ide_usuario,
            det_recibo,
            valor_concepto,
            valor_recaudo,
            cod_punto_pago,
            pagado,
            ide_banco,
            cod_colegio,
            cod_forma_pago,
            cod_nivel_educativo
                    ) VALUES (
                            ${encabezado.ide_fact_concepto_enc},
                            ${encabezado.num_recibo},
                            '${encabezado.fec_recibo}',
                            '${encabezado.cod_ter}',
                            ${encabezado.ide_usuario},
                            '${encabezado.det_recibo}',
                            ${encabezado.valor_concepto},
                            ${encabezado.valor_recaudo},
                            ${encabezado.cod_punto_pago},
                            '${encabezado.pagado}',
                            ${encabezado.ide_banco},
                            ${encabezado.cod_colegio},
                            ${encabezado.cod_forma_pago},
                            ${encabezado.cod_nivel_educativo}
    
                    )`;

        console.log(query1);


        const query2 = `INSERT INTO vup_fact_concepto_escolar_detalle (
    ide_fact_concepto_det,
    ide_fact_concepto_enc,
    ide_concepto,
    cantidad,
    valor_concepto,
    sub_total,
    ide_contabilidad_debito_causacion,
    ide_contabilidad_credito_causacion,
    ide_encabezado_contabilidad_causacion,
    ide_contabilidad_debito_recaudo,
    ide_contabilidad_credito_recaudo,
    ide_encabezado_contabilidad_recaudo,
    ide_presupuesto_recurso,
    cod_centro_costo_deb_causacion,
    cod_centro_costo_cre_causacion,
    cod_centro_costo_deb_recaudo,
    cod_centro_costo_cre_recaudo)

    VALUES 
        
        `;
        let queryAux = "";
        for (const det of detalle) {
            queryAux = queryAux + `(
            ${cod_det_factura + 1},
            ${det.ide_fact_concepto_enc},
            ${det.ide_concepto},
            ${det.cantidad},
            ${det.valor_concepto},
            ${det.sub_total},
            -1,
            -1,
            -1,
            -1,
            -1,
            -1,
            -1,
            -1,
            -1,
            -1,
            -1),`;
        }

        let queryFinal = query2 + queryAux.substring(0, queryAux.length - 1);;

        console.log(queryFinal);

        transaction.begin((error: any) => {

            let rolledBack = false
            transaction.on('rollback', (aborted: any) => {
                console.log(aborted);
                rolledBack = true
            });

            let result = new sql.Request(transaction)
                .query(query1, (err: any, result: any) => {

                    if (err) {
                        if (!rolledBack) {
                            transaction.rollback((err2: any) => {
                                // ... error checks
                                console.log("ejecutando rollback");
                                reject([false, err, query1 + " ; " + queryFinal]);
                            })
                        }
                    } else {
                        //ejecutar la siguiente consulta
                        let result2 = new sql.Request(transaction)
                            .query(queryFinal, (err: any, result: any) => {

                                if (err) {
                                    transaction.rollback((err2: any) => {
                                        reject([false, err, query1 + " ; " + queryFinal]);
                                    });
                                } else {
                                    transaction.commit((err2: any) => {
                                        // ... error checks
                                        console.log("ejecutando commit");
                                        resolve([true, null]);

                                    })
                                }

                            });



                    }
                });

        });


    });

}



//eliminar detalle y factura de sysapolo

export const eliminarReciboPago = async (encabezado: FacturaSysApolo) => {
    const cnn = await conSysApolo();


    return new Promise((resolve, reject) => {
        let transaction = new sql.Transaction(cnn);

        const query1: string = `DELETE FROM vup_fact_concepto_escolar_detalle WHERE ide_fact_concepto_enc=${encabezado.ide_fact_concepto_enc} `;

        const query2 = `DELETE FROM vup_fact_concepto_escolar_encabezado WHERE ide_fact_concepto_enc=${encabezado.ide_fact_concepto_enc}`;

        transaction.begin((error: any) => {

            let rolledBack = false
            transaction.on('rollback', (aborted: any) => {
                console.log(aborted);
                rolledBack = true
            });

            let result = new sql.Request(transaction)
                .query(query1, (err: any, result: any) => {

                    if (err) {
                        if (!rolledBack) {
                            transaction.rollback((err2: any) => {
                                // ... error checks
                                console.log("ejecutando rollback");
                                reject([false, err, query1 + " ; " + query2]);
                            })
                        }
                    } else {
                        //ejecutar la siguiente consulta
                        let result2 = new sql.Request(transaction)
                            .query(query2, (err: any, result: any) => {

                                if (err) {
                                    transaction.rollback((err2: any) => {
                                        reject([false, err, query1 + " ; " + query2]);
                                    });
                                } else {
                                    transaction.commit((err2: any) => {
                                        // ... error checks
                                        console.log("ejecutando commit");
                                        resolve([true, null]);

                                    })
                                }

                            });
                    }
                });

        });


    });

}