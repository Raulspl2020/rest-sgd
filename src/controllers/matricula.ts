import { getInfoMatricula, getDetPeriodo } from "../provider/matricula_provider";
import { getConfigPeriodo, getPaquete, getDescuento, getCategriaDescuento, getCategoriaPorcentajeByMatricula } from "../provider/pago_provider";
import { parse, format } from 'date-format-parse';
import * as moneda from 'currency-formatter';


export const consultarpagoMatricula = async (id_matricula: any) => {
    let fechaActual = format(new Date(), 'YYYY-MM-DD');
    //let token = req.body.token;
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
    id_matricula = id_matricula.trim();
    try {
        let result = await getInfoMatricula(id_matricula);
        console.log(result[0]);
        if (result[0].length > 0) {
            resultDB = result[0][0];
            let resultConfig = await getConfigPeriodo();
            //para consultar las fechas de matriculas 
            periodo = await getDetPeriodo(resultDB.cod_colegio, resultDB.cod_periodo, fechaActual);


            //consular los descuentos y multas que un estudiante tiene asignados
            let resultDto = await getDescuento(resultDB.cod_matricula, resultDB.cod_periodo);
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



            //configurar deacuerdo a la configuracion del periodo
            if (resultDB.nro_creditos <= resultConfig.min_creditos) {

                //se debe cobrar por credito individual
                console.log("Se cobra por creditos");

                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 1);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 4);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 5);
                }




                // resultPaquete = await getPaquete(resultDB.cod_periodo, 1);


                if (resultPaquete != false) {

                    descripcionFactura = "" + resultPaquete[0].paquete + auxDescripcion

                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {





                        //si se puede aplicar descuento externo
                        if (element.descuento_ext == '1') {

                            console.log("Se va a aplicar descuento");

                            //añade aumento para matricula extraordinaria
                            if (periodo == false) {
                                precios[index].aumento = resultConfig.porcentaje_ext;
                                descripcionFactura = descripcionFactura + "+ AUMENTO 10% MATRICULA EXTRAORDINARIA";
                            }
                            console.log(precios[index].aumento);


                            let totaAPagar = 0;
                            if (element.cantidad > 0) {
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            } else {
                                precios[index].cantidad = resultDB.nro_creditos;
                                precios[index].descuento = porcentaje_descuento;
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


                        //APLICA DESCUENTO A TODOS LOS CONCEPTOS SI ESTA CONFIGURADO
                        resultDto.forEach((row: any) => {
                            //si aplica descuento sino aplica aumento
                            if (row.tipo == 1 && row.accion == 1) {
                                precios[index].descuento = row.porcentaje;
                            } else if (row.tipo == 1 && row.accion == 0) {
                                precios[index].aumento = row.porcentaje;
                            }

                        });



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
                        let subtotal = (element.valor_unidad * element.cantidad);
                        precios[index].subtotal = (subtotal + (subtotal * element.aumento)) - (subtotal * element.descuento)
                        total_a_pagar = element.subtotal + total_a_pagar;
                    });


                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            } else {
                //se cobra el valor total de la matricula
                console.log("Se cobra matricula completa");

                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 2);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 3);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 5);
                }

                if (resultPaquete != false) {


                    descripcionFactura = "" + resultPaquete[0].paquete + auxDescripcion

                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element: any, index: number) => {


                        //si se puede aplicar descuento externo
                        if (element.descuento_ext == '1') {

                            //añade aumento para matricula extraordinaria
                            if (periodo == false) {
                                precios[index].aumento = resultConfig.porcentaje_ext;
                                descripcionFactura = descripcionFactura + "+ AUMENTO 10% MATRICULA EXTRAORDINARIA";
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
                    precios.forEach((element: any, index: number) => {
                        precios[index].paquete = descripcionFactura;
                        let subtotal = (element.valor_unidad * element.cantidad);
                        precios[index].subtotal = (subtotal + (subtotal * element.aumento)) - (subtotal * element.descuento)
                        total_a_pagar = element.subtotal + total_a_pagar;
                    });


                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            }


            return {
                error: false,
                message: "Ejecución correcta",
                matricula: resultDB,
                soportes : await getCategoriaPorcentajeByMatricula(id_matricula),
                detalle_factura: resultPaquete,
                total_a_pagar: moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(),
                total_general: moneda.format(total_sin_descuento, { locale: 'es-CO' }).replace('$', '').trim(),
                total_a_pagar_int: moneda.unformat(moneda.format(total_a_pagar, { locale: 'es-CO' }).replace('$', '').trim(), { locale: 'es-CO' })


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

    try {
        let result: any = await consultarpagoMatricula(req.params.id_matricula.trim());
        result.categorias = await getCategriaDescuento(1);
        return res.status(200).json(result);

    } catch (error) {
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
            let resultDto = await getDescuento(resultDB.cod_matricula, resultDB.cod_periodo);
            resultDto.forEach((row: any) => {
                porcentaje_descuento = porcentaje_descuento + row.porcentaje;
            });


            //configurar deacuerdo a la configuracion del periodo
            if (resultDB.nro_creditos <= resultConfig.min_creditos) {

                //se debe cobrar por credito individual
                console.log("Se cobra por creditos");

                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 1);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 4);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 5);
                }


                // resultPaquete = await getPaquete(resultDB.cod_periodo, 1);


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
                    precios.forEach((element: any, index: number) => {
                        let subtotal = (element.valor_unidad * element.cantidad);
                        precios[index].subtotal = (subtotal + (subtotal * element.aumento)) - (subtotal * element.descuento)
                        total_a_pagar = element.subtotal + total_a_pagar;
                    });





                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            } else {
                //se cobra el valor total de la matricula
                console.log("Se cobra matricula completa");

                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 2);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 3);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 5);
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
                    precios.forEach((element: any, index: number) => {
                        let subtotal = (element.valor_unidad * element.cantidad);
                        precios[index].subtotal = (subtotal + (subtotal * element.aumento)) - (subtotal * element.descuento)
                        total_a_pagar = element.subtotal + total_a_pagar;
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