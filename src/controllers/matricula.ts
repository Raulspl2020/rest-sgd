import { getInfoMatricula, getDetPeriodo, insertArrayDescuento, getDataDescuentosByCodigo, getCargaDescuentos, verificaCargueFacturado, eliminaDescuentosCargue } from "../provider/matricula_provider";
import { getConfigPeriodo, getPaquete, getDescuento, getCategriaDescuento, getCategoriaPorcentajeByMatricula, existePago, getFactura, getPagoFactura, getFacturaByMatricula, getPagoFacturaByFacturaIds } from "../provider/pago_provider";
import { parse, format } from 'date-format-parse';
import * as moneda from 'currency-formatter';
import xlsx from 'node-xlsx';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import stream from 'stream';
import { IDetalleFactura } from "../interfaces/facturas.interface";
import { calcularSubTotal } from "../helpers/factura.util";
import { IStudentType } from "../interfaces/clientes.interface";
import fetch from "node-fetch";
import moment from 'moment';

const getFinancieroApiUrl = (): string => {
    const baseUrl = (process.env.FINANCIERO_API_URL || "").trim();
    if (baseUrl.length > 0) {
        return baseUrl.replace(/\/+$/, "");
    }

    return "";
};

const getStudentTypeUrl = (): string => {
    const financieroApiUrl = getFinancieroApiUrl();
    if (financieroApiUrl.length > 0) {
        return `${financieroApiUrl}/invoice/studenttype`;
    }

    return (process.env.URL_GET_DATE || "").trim();
};

const INSCRIPTION_PACKAGE_TECHNOLOGY = 6;
const INSCRIPTION_PACKAGE_SPECIALIZATION = 34;
const SPECIALIZATION_LEVEL_CODES = new Set([11, 16]);
const MAX_DISCOUNT_RATE = 1;

const toNumber = (value: any): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const clampDiscountRate = (value: any): number => {
    const discountRate = toNumber(value);
    if (discountRate <= 0) {
        return 0;
    }

    return discountRate > MAX_DISCOUNT_RATE ? MAX_DISCOUNT_RATE : discountRate;
};

const sumDiscountRateWithCap = (currentRate: any, incomingRate: any): number => {
    const current = clampDiscountRate(currentRate);
    const incoming = clampDiscountRate(incomingRate);
    return clampDiscountRate(current + incoming);
};

type ProfileLogger = <T>(label: string, task: () => Promise<T>) => Promise<T>;

const createProfileLogger = (enabled: boolean, scope: string): ProfileLogger => {
    const entries: Array<{ label: string; ms: number }> = [];
    const profile = async <T>(label: string, task: () => Promise<T>): Promise<T> => {
        if (!enabled) {
            return task();
        }

        const start = Date.now();
        try {
            return await task();
        } finally {
            const ms = Date.now() - start;
            entries.push({ label, ms });
            console.log(`[profile:${scope}] ${label}: ${ms}ms`);
            console.log(`[perf] ${label} ${ms}ms`);
        }
    };

    (profile as any).entries = entries;
    return profile;
};

const logProfileSummary = (profile: ProfileLogger, totalMs: number) => {
    const entries = ((profile as any).entries || []) as Array<{ label: string; ms: number }>;
    entries
        .slice()
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 10)
        .forEach((entry, index) => {
            const pct = totalMs > 0 ? ((entry.ms * 100) / totalMs).toFixed(1) : "0.0";
            console.log(`[perf] TOP ${index + 1} ${entry.label} ${entry.ms}ms ${pct}%`);
        });
    console.log(`[perf] TOTAL REQUEST ${totalMs}ms`);
};

const calculateSubtotalWithDiscountCap = (
    unitValue: any,
    quantity: any,
    increaseRate: any,
    discountRate: any,
): number => {
    const subtotal = toNumber(unitValue) * toNumber(quantity);
    const increase = toNumber(increaseRate);
    const discount = clampDiscountRate(discountRate);
    const total = (subtotal + (subtotal * increase)) - (subtotal * discount);

    // Defensive floor: billing totals must never be negative.
    return total < 0 ? 0 : total;
};

const normalizeLevelName = (value: any): string => {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
};

export const resolverCodigoPaqueteInscripcion = (matricula: any, packageParam?: any): number => {
    const packageCode = Number(packageParam);
    if (Number.isFinite(packageCode) && packageCode > 0) {
        return packageCode;
    }

    const nivel = normalizeLevelName(matricula?.nom_nivel_educativo);
    if (nivel.includes("ESPECIALIZ")) {
        return INSCRIPTION_PACKAGE_SPECIALIZATION;
    }

    if (nivel.includes("TECNOLOG")) {
        return INSCRIPTION_PACKAGE_TECHNOLOGY;
    }

    if (SPECIALIZATION_LEVEL_CODES.has(Number(matricula?.cod_nivel_edu))) {
        return INSCRIPTION_PACKAGE_SPECIALIZATION;
    }

    return INSCRIPTION_PACKAGE_TECHNOLOGY;
};

//====================
//   /matricula/generarpagoinscripcion 
//=====================
export const consultarPagoInscripcion = async (req: any, res: any) => {
    let resultDB: any;
    let resultPaquete: any;
    let total = 0;
    let total_a_pagar = 0;
    let total_con_descuento = 0;
    let total_sin_descuento = 0;
    let porcentaje_descuento = 0;
    let porcentaje_aumento = 0;
    let descripcionFactura = "";
    let auxDescripcion = "";
    let precios: any;
    let periodo: any;
    let id_matricula = req.params.id_matricula.trim();

    try {
        let result = await getInfoMatricula(id_matricula);
        console.log(result);

        resultDB = result[0][0];

        if (result[0].length > 0) {

            const paqueteInscripcion = resolverCodigoPaqueteInscripcion(resultDB, req.query.package);

            resultPaquete = await getPaquete(paqueteInscripcion);
            if (!resultPaquete || resultPaquete.length < 1) {
                throw new Error("No se encontraron precios configurados");
            }
            //consular los descuentos y multas que un estudiante tiene asignados
            let resultDto = await getDescuento(resultPaquete[0].categoria_id, resultDB.cod_periodo, resultDB.ide_persona);
            resultDto.forEach((row: any) => {
                //si aplica descuento sino aplica aumento, si es 1 añade un descuento
                if (row.accion == 1) {
                    porcentaje_descuento = porcentaje_descuento + row.porcentaje;
                    auxDescripcion = auxDescripcion + " + DESCUENTO " + (row.porcentaje * 100) + "% " + row.observacion
                } else {
                    porcentaje_aumento = porcentaje_aumento + row.porcentaje;
                    auxDescripcion = auxDescripcion + " + AUMENTO " + (row.porcentaje * 100) + "% " + row.observacion
                }
            });

            resultPaquete.forEach((element: any, index: number) => {

                //calcula el total sin descuento
                if (element.cantidad > 0) {
                    total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                } else {
                    total = element.subtotal * Number(resultDB.nro_creditos);
                    total_a_pagar = total_a_pagar + total;
                }
                total_sin_descuento = total_a_pagar;



            });


        } else {
            throw new Error("No se encontró la inscripción");
        }


        // let estadoPago = await existePago('6', id_matricula);



        //verifica si ya existe una factura creada con esa matricula y con ese paquete

        let pagoFactura: any = [];
        const paqueteInscripcion = resolverCodigoPaqueteInscripcion(resultDB, req.query.package);
        let resFactura = await getFacturaByMatricula(id_matricula, paqueteInscripcion.toString());
        //si encuentra factura creada verifica si tiene pagos
        if (resFactura.length > 0) {
            pagoFactura = await getPagoFactura(resFactura[0]._id);

            //si encuentra pagos exitosos
            if (pagoFactura.length > 0) {


                pagoFactura.forEach((pago: any) => {
                    pago.fecha = format(pago.fecha, 'DD-MM-YYYY hh:mm:ss A');
                });

                //actualizamos los conceptos de la factura a mostrar
                resultPaquete.forEach((con: any) => {

                    resFactura.forEach((fact: any) => {

                        if (con.concepto_id == fact.concepto_id) {
                            con.cantidad = fact.cantidad;
                            con.descuento = fact.descuento;
                            con.valor_unidad = fact.valor_unidad;
                            con.aumento = fact.aumento;
                        }

                    });

                });

                //actualizamos el total a pagar
                total_a_pagar = 0;
                resultPaquete.forEach((element: any, index: number) => {
                    let subtotal = (element.valor_unidad * element.cantidad);
                    resultPaquete[index].subtotal = (subtotal + (subtotal * element.aumento)) - (subtotal * element.descuento)
                    total_a_pagar = element.subtotal + total_a_pagar;
                });

            }



        }




        return res.status(200).json({
            error: false,
            message: "Ejecución correcta",
            estadopago: pagoFactura,
            matricula: resultDB,
            detalle_factura: resultPaquete,
            total_a_pagar: moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(),
            total_general: moneda.format(total_sin_descuento, { locale: 'es-CO' }).replace('$', '').trim(),
            total_a_pagar_int: moneda.unformat(moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' })
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }
}



export const consultarpagoMatricula = async (id_matricula: any, profile: ProfileLogger = createProfileLogger(false, "matricula")) => {
    let fechaActual = format(new Date(), 'YYYY-MM-DD');
    //let token = req.body.token;
    let resultDB: any;
    let descuentos = [];
    let aumentos = [];
    let resultPaquete: any;
    let total = 0;
    let total_a_pagar = 0;
    let total_con_descuento = 0;
    let total_sin_descuento = 0;
    let porcentaje_descuento = 0;
    let porcentaje_aumento = 0;
    let descripcionFactura = "";
    let auxDescripcion = "";
    let precios: any;
    let periodo: any;
    id_matricula = id_matricula.trim();
    let resultDescuentos: any = [];
    try {
        let result = await profile("getInfoMatricula", () => getInfoMatricula(id_matricula));
        if (result[0].length > 0) {
            resultDB = result[0][0];
            const resultConfigPromise = profile("getConfigPeriodo", () => getConfigPeriodo());
            const resultDtoPromise = profile("getDescuento", () => getDescuento("1", resultDB.cod_periodo, resultDB.ide_persona));

            // TODO: para consultar las fechas de matriculas 
            // periodo = await getDetPeriodo(resultDB.cod_colegio, resultDB.cod_periodo, fechaActual);

           const studentTypeUrl = getStudentTypeUrl();
           const response = await profile("getStudentType.fetch", () => fetch(`${studentTypeUrl}?matriculaId=${id_matricula}`));
           const studentType: IStudentType =  await profile("getStudentType.parseJson", () => response.json());
           const currenDate =  new Date();

           const momentCurrent = moment().utcOffset(-5);

           const momentDb = moment(studentType.fechaFinMatricula)
             .utcOffset(-5)
             .set({ hour: 23, minute: 59, second: 59 });

           if (
            momentCurrent > momentDb && studentType.fechaFinMatricula !=null
          ) {
            periodo = false;
          }else{
            periodo =  studentType;
          }


          



            //consular los descuentos y multas que un estudiante tiene asignados
            const [resultConfig, resultDto] = await Promise.all([resultConfigPromise, resultDtoPromise]);


            resultDto.forEach((row: any) => {
                //si aplica descuento sino aplica aumento, si es 1 añade un descuento
                if (row.accion == 1) {
                    const discountRate = clampDiscountRate(row.porcentaje);
                    let registro = {
                        'id': row._id,
                        'descripcion': row.descripcion,
                        'descuento': (discountRate * 100)
                    };
                    resultDescuentos.push(registro);

                    // Business rule: never allow effective discount over 100%.
                    porcentaje_descuento = sumDiscountRateWithCap(porcentaje_descuento, discountRate);
                    let desc = (row.observacion == null) ? row.descripcion + " " : row.observacion;
                    auxDescripcion = `+ DESCUENTO ${(discountRate * 100)}% ${desc}`;
                } else {
                    porcentaje_aumento = porcentaje_aumento + row.porcentaje;
                    let desc = (row.observacion == null) ? row.descripcion + " " : row.observacion;
                    auxDescripcion = `+ DESCUENTO ${(row.porcentaje * 100)}% ${desc}`;
                }
            });

            //configurar deacuerdo a la configuracion del periodo
            if (resultDB.nro_creditos <= resultConfig.min_creditos && resultDB.nro_creditos > 0) {

                //se debe cobrar por credito individual
                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(1));
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(4));
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(5));
                }else if(resultDB.cod_nivel_edu == 11){
                    resultPaquete = await profile("getPaquete", () => getPaquete(33));
                }




                // resultPaquete = await getPaquete( 1);


                if (resultPaquete != false && resultPaquete !=undefined) {

                    descripcionFactura = " " + resultPaquete[0].paquete + " + " + auxDescripcion

                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {


                        //si se puede aplicar descuento externo
                        if (element.descuento_ext == '1') {

                            //APLICA DESCUENTO A TODOS LOS CONCEPTOS SI ESTA CONFIGURADO
                            resultDto.forEach((row: any) => {
                                //si aplica descuento sino aplica aumento

                                //si es un descuento
                                if (row.accion == 1) {
                                    //si el soporte permite aplicar en todos los conceptos
                                    if (row.tipo == 1) {
                                        precios[index].descuento = sumDiscountRateWithCap(precios[index].descuento, row.porcentaje);
                                    } else {

                                        if( [ 5,6,7,1,2,52 ].includes(precios[index].concepto_id) ){   
                                              precios[index].descuento = sumDiscountRateWithCap(precios[index].descuento, row.porcentaje);
                                         }
                                 
                                    }

                                    //si es un aumento
                                } else {
                                    //si el soporte permite aplicar en todos los conceptos
                                    if (row.tipo == 1) {
                                        precios[index].aumento = precios[index].aumento + row.porcentaje;
                                    } else {

                                     
                                        if( [ 5,6,7,52 ].includes(precios[index].concepto_id) ){   
                                              precios[index].aumento = precios[index].aumento + row.porcentaje;
                                         }

                                    }
                                }


                            });





                            //añade aumento para matricula extraordinaria
                            if (periodo == false) {
                                precios[index].aumento = precios[index].aumento = resultConfig.porcentaje_ext;

                                if (resultConfig.porcentaje_ext != 0 && index == 0) {
                                    descripcionFactura = descripcionFactura + "+ AUMENTO 20% MATRICULA EXTRAORDINARIA";
                                }

                            }
                            let totaAPagar = 0;
                            if (element.cantidad > 0) {
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            } else {
                                precios[index].cantidad = resultDB.nro_creditos;
                                //  precios[index].descuento = porcentaje_descuento;
                                precios[index].aumento = porcentaje_aumento + precios[index].aumento;
                                porcentaje_descuento = 0;
                                porcentaje_aumento = 0;
                                total = element.subtotal * Number(resultDB.nro_creditos);
                                totaAPagar = totaAPagar + total;
                            }
                            total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);

                        } else {
                            let totaAPagar = 0;
                            if (element.cantidad > 0) {
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            } else {
                                total = element.subtotal * Number(resultDB.nro_creditos);
                                totaAPagar = totaAPagar + total;
                                precios[index].cantidad = resultDB.nro_creditos;
                            }
                            total_sin_descuento = totaAPagar;
                        }


                        //calcula el total sin descuento
                        if (element.cantidad > 0) {
                            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                        } else {
                            total = element.subtotal * Number(resultDB.nro_creditos);
                            total_a_pagar = total_a_pagar + total;
                        }
                        total_sin_descuento = total_a_pagar;

                    });


                    //volvemos a recorrer para calcular totales
                    total_a_pagar = 0;
                    precios.forEach((element: any, index: number) => {
                        precios[index].paquete = descripcionFactura;
                        precios[index].descuento = clampDiscountRate(precios[index].descuento);
                        precios[index].subtotal = calculateSubtotalWithDiscountCap(
                            element.valor_unidad,
                            element.cantidad,
                            element.aumento,
                            element.descuento,
                        );
                        total_a_pagar = element.subtotal + total_a_pagar;
                    });


                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            } else {
                //se cobra el valor total de la matricula
                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(2));
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(3));
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await profile("getPaquete", () => getPaquete(5));
                }else if(resultDB.cod_nivel_edu == 11){
                    resultPaquete = await profile("getPaquete", () => getPaquete(33));
                }

                if (resultPaquete != false && resultPaquete !=undefined) {


                    descripcionFactura = "" + resultPaquete[0].paquete + auxDescripcion

                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {


                        //si se puede aplicar descuento externo
                        if (element.descuento_ext == '1') {



                            //APLICA DESCUENTO A TODOS LOS CONCEPTOS SI ESTA CONFIGURADO
                            resultDto.forEach((row: any) => {
                                //si aplica descuento sino aplica aumento

                                //si es un descuento
                                if (row.accion == 1) {
                                    //si el soporte permite aplicar en todos los conceptos
                                    if (row.tipo == 1) {
                                        precios[index].descuento = sumDiscountRateWithCap(precios[index].descuento, row.porcentaje);
                                    } else {

                                        if( [ 5,6,7,52 ].includes(precios[index].concepto_id) ){
                                            precios[index].descuento = sumDiscountRateWithCap(precios[index].descuento, row.porcentaje);
                                        } 

                                    }

                                    //si es un aumento
                                } else {
                                    //si el soporte permite aplicar en todos los conceptos
                                    if (row.tipo == 1) {
                                        precios[index].aumento = precios[index].aumento + row.porcentaje;
                                    } else {

                                        //si es un aumento y el concepto es de matricula    
                                        if( [ 5,6,7,1,2,52 ].includes(precios[index].concepto_id) ){   
                                            precios[index].descuento = precios[index].descuento + row.porcentaje;
                                         }

                                    }
                                }


                            });



                            //añade aumento para matricula extraordinaria
                            if (periodo == false) {
                                let auxDes = descripcionFactura;
                                precios[index].aumento = precios[index].aumento + resultConfig.porcentaje_ext;
                                if (resultConfig.porcentaje_ext != 0 && index == 0) {
                                    descripcionFactura = descripcionFactura + "+ AUMENTO 20% MATRICULA EXTRAORDINARIA";
                                }


                            }

                            let totaAPagar = 0;
                            totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            // precios[index].descuento = porcentaje_descuento; tener en cuenta


                            total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);

                        } else {
                            let totaAPagar = 0;
                            totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            total_sin_descuento = totaAPagar;
                        }






                        //calcula el total sin descuento
                        if (element.cantidad > 0) {
                            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                        } else {
                            total = element.subtotal * Number(resultDB.nro_creditos);
                            total_a_pagar = total_a_pagar + total;
                        }
                        total_sin_descuento = total_a_pagar;

                    });




                } else {
                    throw new Error("No se encontraron precios configurados");
                }

                //RECORREMOS PARA APLICAR LOS DESCUENTOS EN ORDEN ASCENDENTE
                /*  resultPaquete.forEach((element_fac: any) => {
  
                      if(element_fac.descuento_ext=='1'){
                          let auxSubtotal =  (element_fac.cantidad * element_fac.valor_unidad) +  ((element_fac.cantidad * element_fac.valor_unidad) * element_fac.aumento);
                          let subtotal = 0;
                          resultDescuentos.forEach((element_desc: any, index: number) => {
                              auxSubtotal =  auxSubtotal -  (auxSubtotal * (element_desc.descuento/100));
                          });
                          element_fac.subtotal = auxSubtotal;
                          console.log(element_fac);
                      }
  
                  });
                  */

                //volvemos a recorrer para calcular totales
                total_a_pagar = 0;
                precios.forEach((element: any, index: number) => {
                    precios[index].paquete = descripcionFactura;
                    precios[index].descuento = clampDiscountRate(precios[index].descuento);
                    precios[index].subtotal = calculateSubtotalWithDiscountCap(
                        element.valor_unidad,
                        element.cantidad,
                        element.aumento,
                        element.descuento,
                    );
                    total_a_pagar = element.subtotal + total_a_pagar;
                });



                // console.log(resultPaquete);

            }


            //verifica si ya existe una factura creada con esa matricula y con ese paquete
            // let estadoPago = await existePago(resultPaquete[0].codigo, id_matricula);
            const pagoFactura: any[] = [];
            const resFactura: any[] = await profile("getFacturaByMatricula", () => getFacturaByMatricula(id_matricula, resultPaquete[0].codigo));
            const facturaIds = Array.from(new Set(resFactura.map((factura) => factura._id)));
            pagoFactura.push(...await profile("getPagoFacturaByFacturaIds", () => getPagoFacturaByFacturaIds(facturaIds)));



            //si encuentra factura creada verifica si tiene pagos
            if (resFactura.length > 0) {

                //si encuentra pagos exitosos
                if (pagoFactura.length > 0) {


                    pagoFactura.forEach((pago: any) => {
                        pago.fecha = format(pago.fecha, 'DD-MM-YYYY hh:mm:ss A');
                    });

                    //actualizamos los conceptos de la factura a mostrar
                    resultPaquete.forEach((con: any) => {

                        resFactura.forEach((fact: any) => {

                            if (con.concepto_id == fact.concepto_id) {
                                con.cantidad = fact.cantidad;
                                con.descuento = clampDiscountRate(fact.descuento);
                                con.valor_unidad = fact.valor_unidad;
                                con.aumento = fact.aumento;
                            }

                        });

                    });

                    //actualizamos el total a pagar
                    total_a_pagar = 0;
                    resultPaquete.forEach((element: any, index: number) => {
                        resultPaquete[index].descuento = clampDiscountRate(resultPaquete[index].descuento);
                        resultPaquete[index].subtotal = calculateSubtotalWithDiscountCap(
                            element.valor_unidad,
                            element.cantidad,
                            element.aumento,
                            element.descuento,
                        );
                        total_a_pagar = element.subtotal + total_a_pagar;
                    });

                }



            }
            // Defensive guard: never expose payable totals below zero.
            // This protects payment flows even if upstream data is inconsistent.
            const safeTotalToPay = Math.max(toNumber(total_a_pagar), 0);

            return {
                error: false,
                message: "Ejecución correcta",
                matricula: resultDB,
                estadopago: pagoFactura,
                soportes: await profile("getCategoriaPorcentajeByMatricula", () => getCategoriaPorcentajeByMatricula('1', resultDB.ide_persona, resultDB.cod_periodo)),
                descuentos: resultDescuentos,
                detalle_factura: resultPaquete,
                total_a_pagar: moneda.format(safeTotalToPay, { locale: 'es-CO' }).replace('$', '').trim(),
                total_general: moneda.format(total_sin_descuento, { locale: 'es-CO' }).replace('$', '').trim(),
                total_a_pagar_int: moneda.unformat(moneda.format(safeTotalToPay, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' })

            };

        } else {
            throw new Error("No se encontró matricula académica");
        }


    } catch (error) {
        throw new Error(error.message);
    }

}




//====================
//   /matricula/generarpagomatricula 
//=====================
export const generarpagoMatricula = async (req: any, res: any) => {
    const startedAt = Date.now();
    const idMatricula = req.params.id_matricula?.trim();
    const endpoint = `/api/matricula/generarpagomatricula/${idMatricula}`;
    console.log(`[perf:rest-sgd] GET ${endpoint} start params=${JSON.stringify(req.params)} query=${JSON.stringify(req.query)}`);

    try {
        const enableProfile = true;
        const profile = createProfileLogger(enableProfile, `pagomatricula:${idMatricula}`);
        const [result, categorias]: any[] = await Promise.all([
            profile("consultarpagoMatricula", () => consultarpagoMatricula(idMatricula, profile)),
            profile("getCategriaDescuento", () => getCategriaDescuento(1)),
        ]);

        result.categorias = categorias;
        logProfileSummary(profile, Date.now() - startedAt);
        console.log(`[perf:rest-sgd] GET ${endpoint} total ${Date.now() - startedAt}ms`);
        console.log(`[perf] GET ${endpoint} fin ${Date.now() - startedAt}ms`);
        return res.status(200).json(result);

    } catch (error) {
        console.log(`[perf] GET ${endpoint} fin ${Date.now() - startedAt}ms`);
        console.log(`[perf:rest-sgd] GET ${endpoint} failed ${Date.now() - startedAt}ms error=${error?.message}`);
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }

}



//====================
//   /matricula/generarpagomatricula 
//=====================
export const generarpagoMatricula2 = async (req: any, res: any) => {
    let fechaActual = format(new Date(), 'YYYY-MM-DD');
    let token = req.body.token;
    let resultDB: any;
    let resultPaquete: any;
    let total = 0;
    let total_a_pagar = 0;
    let total_con_descuento = 0;
    let total_sin_descuento = 0;
    let porcentaje_descuento = 0;
    let precios: any;
    let periodo: any;
    let id_matricula = req.params.id_matricula.trim();
    try {
        let result = await getInfoMatricula(id_matricula);
        console.log(result[0]);
        if (result[0].length > 0) {
            resultDB = result[0][0];
            let resultConfig = await getConfigPeriodo();
            //para consultar las fechas de matriculas 
            periodo = await getDetPeriodo(resultDB.cod_colegio, resultDB.cod_periodo, fechaActual);

            //consular los descuentos que un estudiante tiene asignados
            let resultDto = await getDescuento(1, resultDB.cod_periodo, resultDB.ide_persona);
            resultDto.forEach((row: any) => {
                porcentaje_descuento = porcentaje_descuento + row.porcentaje;
            });


            //configurar deacuerdo a la configuracion del periodo
            if (resultDB.nro_creditos <= resultConfig.min_creditos) {

                //se debe cobrar por credito individual
                console.log("Se cobra por creditos");

                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await getPaquete(1);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(4);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(5);
                }else if(resultDB.cod_nivel_edu == 11){
                    resultPaquete = await getPaquete(33);
                }


                // resultPaquete = await getPaquete( 1);


                if (resultPaquete != false) {

                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {


                        //si se puede aplicar descuento externo
                        if (element.descuento_ext == '1') {

                            if (periodo == false) {
                                precios[index].aumento = resultConfig.porcentaje_ext;
                            }


                            let totaAPagar = 0;
                            if (element.cantidad > 0) {
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            } else {
                                precios[index].cantidad = resultDB.nro_creditos;
                                precios[index].descuento = porcentaje_descuento;
                                porcentaje_descuento = 0;
                                total = element.subtotal * Number(resultDB.nro_creditos);
                                totaAPagar = totaAPagar + total;
                            }
                            total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);

                        } else {
                            let totaAPagar = 0;
                            if (element.cantidad > 0) {
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            } else {
                                total = element.subtotal * Number(resultDB.nro_creditos);
                                totaAPagar = totaAPagar + total;
                                precios[index].cantidad = resultDB.nro_creditos;
                            }
                            total_sin_descuento = totaAPagar;
                        }

                        //calcula el total sin descuento
                        if (element.cantidad > 0) {
                            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                        } else {
                            total = element.subtotal * Number(resultDB.nro_creditos);
                            total_a_pagar = total_a_pagar + total;
                        }
                        total_sin_descuento = total_a_pagar;

                    });


                    //volvemos a recorrer para calcular totales
                    total_a_pagar = 0;
                    precios.forEach((element: IDetalleFactura, index: number) => {
                        const subtotal = calcularSubTotal(element);
                        total_a_pagar =  total_a_pagar+ subtotal;
                    });





                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            } else {
                //se cobra el valor total de la matricula
                console.log("Se cobra matricula completa");

                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await getPaquete(2);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(3);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(5);
                }else if(resultDB.cod_nivel_edu == 11){
                    resultPaquete = await getPaquete(33);
                }

                if (resultPaquete != false) {



                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {


                        //si se puede aplicar descuento externo
                        if (element.descuento_ext == '1') {

                            //añade aumento para matricula extraordinaria
                            if (periodo == false) {
                                precios[index].aumento = resultConfig.porcentaje_ext;
                            }

                            let totaAPagar = 0;
                            totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            precios[index].descuento = porcentaje_descuento;


                            total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);

                        } else {
                            let totaAPagar = 0;
                            totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            total_sin_descuento = totaAPagar;
                        }

                        //calcula el total sin descuento
                        if (element.cantidad > 0) {
                            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                        } else {
                            total = element.subtotal * Number(resultDB.nro_creditos);
                            total_a_pagar = total_a_pagar + total;
                        }
                        total_sin_descuento = total_a_pagar;

                    });

                    //volvemos a recorrer para calcular totales
                    total_a_pagar = 0;
                    precios.forEach((element: IDetalleFactura, index: number) => {
                        const subtotal =calcularSubTotal(element);
                        total_a_pagar = subtotal + total_a_pagar;
                    });


                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            }


            return res.status(200).json({
                error: false,
                message: "Ejecución correcta",
                categorias: await getCategriaDescuento(1),
                matricula: resultDB,
                detalle_factura: resultPaquete,
                total_a_pagar: moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(),
                total_general: moneda.format(total_sin_descuento, { locale: 'es-CO' }).replace('$', '').trim(),
                total_a_pagar_int: moneda.unformat(moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' })


            });

        } else {
            throw new Error("No se encontró la matricula académica");
        }


    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }



}


//====================
//   /matricula/CargaPlantillaDescuento 
//=====================
export const cargaPlantillaDescuento = async (req: any, res: any) => {

    let body = req.body;

    try {

        //subir el archivo si existe
        if (req.files && req.files.archivo) {
            const { archivo } = req.files;
            //  const uploadPath = path.join(__dirname, '../../public/format/plantilla-descuentos.xlsx');
            
            const fileBuffer = fs.readFileSync(archivo.tempFilePath);
            const workSheetsFromBuffer = xlsx.parse(fileBuffer.buffer as ArrayBuffer)
            //  console.log(fs.readFileSync(uploadPath));
            console.log(archivo.data.length);

            console.log(archivo);
            //const workSheetsFromBuffer = xlsx.parse(Buffer.from(archivo.data));
            console.log(workSheetsFromBuffer);
            const primeraHoja = workSheetsFromBuffer[0].data;

            let dataInsert: any = [];

            let codigo_Cargue = uuidv4();
            let fechaActual = format(new Date(), 'YYYY-MM-DD HH:mm:ss');

            primeraHoja.forEach((row: any, index: number) => {
                // console.log(row);


                let rowObject = {
                    'codigo_cargue': (row[0] == undefined || row[0] == '') ? codigo_Cargue : row[0],
                    'config_id': (row[1] == undefined || row[1] == '') ? null : row[1],
                    'porcentaje_estado_id': row[2],
                    'estudiante_id': row[3],
                    'matricula_id': row[4],
                    'porcentaje_categoria_id': row[5],
                    'porcentaje': row[6],
                    'periodo_id': row[7],
                    // 'nom_periodo': row[8]
                    'observacion': (row[8] == undefined || row[8] == '') ? null : row[8],
                    'accion': row[9],
                    'tipo': row[10],
                    'fecha': fechaActual
                };

                if (index > 0) {
                    dataInsert.push(rowObject);
                }


            });

            let resultDB = await insertArrayDescuento(dataInsert);
            if (resultDB[0]) {
                return res.status(200).json({
                    error: false,
                    message: `Cargado exitosamente, se han afectado  ${resultDB[1]} registros`,
                    data: {
                        'codigo': codigo_Cargue,
                        'fecha': fechaActual,
                        'registros': resultDB[1]
                    }
                });
            } else {
                return res.status(200).json({
                    error: true,
                    message: `Archivo procesado con errores, ${resultDB[1].sqlMessage} `
                });
            }


        } else {
            throw new Error("No se ha seleccionado un archivo");
        }

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });

    }

}

//====================
//   /matricula/ListaCargueDescuento
//=====================
export const listaCargueDescuento = async (req: any, res: any) => {
    try {

        let resultDB = await getCargaDescuentos();
        return res.status(200).json({
            error: false,
            data: resultDB
        });


    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }

}
//====================
//   /matricula/eliminarCargueDescuento
//=====================
export const eliminarCargueDescuento = async (req: any, res: any) => {
    let codigoFile = req.params.codigo.trim();
    try {

        //si encuentra registros significa que alguno ya se uso en una factura
        let resultDB = await verificaCargueFacturado(codigoFile);

        if (resultDB.length > 0) {
            return res.status(200).json({
                error: true,
                message: "Algunos descuentos del archivo que se intenta eliminar ya fueron facturados "
            });
        }

        resultDB = await eliminaDescuentosCargue(codigoFile);

        if (!resultDB) {
            throw new Error("Error al eliminar el archivo");
        }

        return res.status(200).json({
            error: false,
            message: "Archivo eliminado "
        });



    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }

}


//====================
//   /matricula/descargarCargueDescuento 
//=====================
export const descargarCargueDescuento = async (req: any, res: any) => {
    let codigoFile = req.params.codigo.trim();

    let columns: any = [];
    let arrayData: any = [];
    try {
        console.log("consultando registros en DB");
        let resultDB = await getDataDescuentosByCodigo(codigoFile);
        console.log("Fin de la consulta");

        if (resultDB.length > 0) {
            console.log(Object.entries(resultDB[0]));
            for (const [key, value] of Object.entries(resultDB[0])) {
                columns.push(key);
            }
            arrayData.push(columns);

            resultDB.forEach((element: any) => {
                let row: any = [];
                for (const [key, value] of Object.entries(element)) {
                    row.push(value);
                }
                arrayData.push(row)
            });

            console.log("construyendo excel");
            const data = arrayData;
            const options = { '!cols': [{ wch: 6 }, { wch: 7 }, { wch: 10 }, { wch: 20 }] };
            var buffer = await xlsx.build([{ name: "Hoja 1", data: data }], options); // Returns a buffer
            console.log("buffer generado excel");

            // return res.download(buffer);
            let fileName: string = `Cargue_${codigoFile}.xlsx`;

            var readStream = new stream.PassThrough();
            readStream.end(buffer);

            res.set('Content-disposition', 'attachment; filename=' + fileName.toString());
            res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            console.log("Iniciando descarga");

            readStream.pipe(res);
            // return res.download(buffer);

        } else {
            res.send(`<h1>No se encontró el archivo solicitado</h1>`);
        }


    } catch (error) {
        console.log("Error al descargar");
        console.log(error);
        res.send(`<h1>Ocurrio un error: ${error.message}</h1>`);
    }


}
