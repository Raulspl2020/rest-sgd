import { getInfoMatricula, getDetPeriodo, insertArrayDescuento, getDataDescuentosByCodigo, getCargaDescuentos, verificaCargueFacturado, eliminaDescuentosCargue } from "../provider/matricula_provider";
import { getConfigPeriodo, getPaquete, getDescuento, getCategriaDescuento, getCategoriaPorcentajeByMatricula, existePago } from "../provider/pago_provider";
import { parse, format } from 'date-format-parse';
import * as moneda from 'currency-formatter';
import xlsx from 'node-xlsx';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import stream from 'stream';

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

        resultDB = result[0][0];

        if (result[0].length > 0) {
            resultPaquete = await getPaquete(6);
            if (resultPaquete.length < 1) {
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


        let estadoPago = await existePago('6', id_matricula);



        return res.status(200).json({
            error: false,
            message: "Ejecución correcta",
            estadopago: estadoPago,
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



export const consultarpagoMatricula = async (id_matricula: any) => {
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
        let result = await getInfoMatricula(id_matricula);
        console.log(result[0]);
        if (result[0].length > 0) {
            resultDB = result[0][0];
            let resultConfig = await getConfigPeriodo();
            //para consultar las fechas de matriculas 
            periodo = await getDetPeriodo(resultDB.cod_colegio, resultDB.cod_periodo, fechaActual);


            //consular los descuentos y multas que un estudiante tiene asignados
            let resultDto = await getDescuento("1", resultDB.cod_periodo, resultDB.ide_persona);
            resultDto.forEach((row: any) => {


                //si aplica descuento sino aplica aumento, si es 1 añade un descuento
                if (row.accion == 1) {
                    let registro = {
                        'id': row._id,
                        'descripcion': row.descripcion,
                        'descuento': (row.porcentaje * 100)
                    };
                    resultDescuentos.push(registro);

                    porcentaje_descuento = porcentaje_descuento + row.porcentaje;
                    auxDescripcion = auxDescripcion + " + DESCUENTO " + (row.porcentaje * 100) + "% " + (row.observacion == null) ? row.descripcion + " " : row.observacion + " ";
                } else {
                    porcentaje_aumento = porcentaje_aumento + row.porcentaje;
                    auxDescripcion = auxDescripcion + " + AUMENTO " + (row.porcentaje * 100) + "% " + (row.observacion == null) ? row.descripcion + " " : row.observacion + " ";
                }
            });







            //configurar deacuerdo a la configuracion del periodo
            if (resultDB.nro_creditos <= resultConfig.min_creditos && resultDB.nro_creditos > 0) {

                //se debe cobrar por credito individual
                console.log("Se cobra por creditos");

                //ciclo tecnologico
                if (resultDB.cod_nivel_edu == 6) {
                    resultPaquete = await getPaquete(1);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(4);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(5);
                }




                // resultPaquete = await getPaquete( 1);


                if (resultPaquete != false) {

                    descripcionFactura = "" + resultPaquete[0].paquete + " + " + auxDescripcion

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
                    resultPaquete = await getPaquete(2);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(3);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(5);
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
                    let subtotal = (element.valor_unidad * element.cantidad);
                    precios[index].subtotal = (subtotal + (subtotal * element.aumento)) - (subtotal * element.descuento)
                    total_a_pagar = element.subtotal + total_a_pagar;
                });



                console.log(resultPaquete);

            }


            let estadoPago = await existePago(resultPaquete[0].codigo, id_matricula);
            return {
                error: false,
                message: "Ejecución correcta",
                matricula: resultDB,
                estadopago: estadoPago,
                soportes: await getCategoriaPorcentajeByMatricula('1', resultDB.ide_persona, resultDB.cod_periodo),
                descuentos: resultDescuentos,
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
                    resultPaquete = await getPaquete(2);
                } else if (resultDB.cod_nivel_edu == 7) {
                    resultPaquete = await getPaquete(3);
                } else if (resultDB.cod_nivel_edu == 16) {
                    resultPaquete = await getPaquete(5);
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
            // const workSheetsFromBuffer = xlsx.parse(fs.readFileSync(uploadPath));
            //  console.log(fs.readFileSync(uploadPath));
            console.log(archivo.data.length);

            console.log(archivo);
            const workSheetsFromBuffer = xlsx.parse(Buffer.from(archivo.data));
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
        let resultDB = await getDataDescuentosByCodigo(codigoFile);

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

            const data = arrayData;
            const options = { '!cols': [{ wch: 6 }, { wch: 7 }, { wch: 10 }, { wch: 20 }] };
            var buffer = xlsx.build([{ name: "Hoja 1", data: data }], options); // Returns a buffer

            // return res.download(buffer);
            var fileName = 'Cargue_' + codigoFile + '.xlsx';

            var readStream = new stream.PassThrough();
            readStream.end(buffer);

            res.set('Content-disposition', 'attachment; filename=' + fileName);
            res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            readStream.pipe(res);

        } else {
            res.send(`<h1>No se encontró el archivo solicitado</h1>`);
        }


    } catch (error) {
        console.log(error);
        res.send(`<h1>Ocurrio un error: ${error.message}</h1>`);
    }


}