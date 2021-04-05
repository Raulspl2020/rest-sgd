import { getInfoMatricula, getDetPeriodo } from "../provider/matricula_provider";
import { getConfigPeriodo, getPaquete, getDescuento } from "../provider/pago_provider";
import { parse,format  } from 'date-format-parse';

//====================
//   /matricula/generarpagomatricula 
//=====================
export const generarpagoMatricula = async (req: any, res: any) => {
    let fechaActual = format(new Date(),  'YYYY-MM-DD');
    let token = req.body.token;
    let resultDB:any;
    let resultPaquete:any;
    let total =0;
    let total_a_pagar=0;
    let total_con_descuento =0;
    let total_sin_descuento = 0;
    let porcentaje_descuento = 0;
    let precios : any;
    let periodo:any;
    let id_matricula = req.params.id_matricula.trim();
    try {
        let result = await getInfoMatricula(id_matricula);
        if (result[0].length > 0) {
            resultDB = result[0][0];
 
            let resultConfig = await getConfigPeriodo();
            //para consultar las fechas de matriculas 
            periodo = await getDetPeriodo(resultDB.cod_colegio,resultDB.cod_periodo,fechaActual);

            //consular los descuentos que un estudiante tiene asignados
            let resultDto = await getDescuento(resultDB.cod_matricula, resultDB.cod_periodo);
            resultDto.forEach((row:any) => {
                porcentaje_descuento = porcentaje_descuento + row.porcentaje;
            });


            //configurar deacuerdo a la configuracion del periodo
            if (resultDB.nro_creditos <= resultConfig.min_creditos) {

                //TODO: verificar de que clico es para calcular el precio

                           //ciclo tecnologico
                if(resultDB.cod_nivel_edu==6){
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 1);
                }else if(resultDB.cod_nivel_edu==7){
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 4);
                }

                //se debe cobrar por credito individual
                console.log("Se cobra por creditos");
                resultPaquete = await getPaquete(resultDB.cod_periodo, 1);


                if (resultPaquete != false) {

                    precios = resultPaquete;
                    //recorrer los detalles de paquete
                    precios.forEach((element:any, index:number) => {
                        

                        //si se puede aplicar descuento externo
                        if(element.descuento_ext=='1'){
                            
                            if(periodo==false){
                                precios[index].aumento = resultConfig.porcentaje_ext;
                            }
                            

                            let totaAPagar= 0;
                            if(element.cantidad > 0){
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            }else{
                                precios[index].cantidad = resultDB.nro_creditos;
                                precios[index].descuento = porcentaje_descuento;
                                porcentaje_descuento=0;
                                total = element.subtotal * Number(resultDB.nro_creditos);
                                totaAPagar = totaAPagar +  total ;
                            }
                            total_con_descuento = totaAPagar - (totaAPagar * porcentaje_descuento);

                        }else{
                            let totaAPagar= 0;
                            if(element.cantidad > 0){
                                totaAPagar = totaAPagar + (element.subtotal * element.cantidad);
                            }else{
                                total = element.subtotal * Number(resultDB.nro_creditos);
                                totaAPagar = totaAPagar +  total ;
                                precios[index].cantidad = resultDB.nro_creditos;
                            }
                            total_sin_descuento = totaAPagar;
                        }

                        //calcula el total sin descuento
                        if(element.cantidad > 0){
                            total_a_pagar = total_a_pagar + (element.subtotal * element.cantidad);
                        }else{
                            total = element.subtotal * Number(resultDB.nro_creditos);
                            total_a_pagar = total_a_pagar +  total ;
                        }
                        total_sin_descuento = total_a_pagar;
                        
                    });


                    //volvemos a recorrer para calcular totales
                    total_a_pagar = 0;
                    precios.forEach((element:any, index:number) => {
                        let subtotal = (element.valor_unidad * element.cantidad);
                        precios[index].subtotal = ( subtotal +  ( subtotal * element.aumento) ) -  ( subtotal * element.descuento)
                        total_a_pagar = element.subtotal + total_a_pagar;
                    });


                    


                } else {
                    throw new Error("No se encontraron precios configurados");
                }




            } else {
                //se cobra el valor total de la matricula
                console.log("Se cobra matricula completa");

                //ciclo tecnologico
                if(resultDB.cod_nivel_edu==6){
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 2);
                }else if(resultDB.cod_nivel_edu==7){
                    resultPaquete = await getPaquete(resultDB.cod_periodo, 3);
                }

               
                if (resultPaquete != false) {


                } else {
                    throw new Error("No se encontraron precios configurados");
                }


                

            }


            return res.json({
                error: false,
                message: "Funcionando matricula",
                detalle_factura : resultPaquete,
                total_a_pagar,
                total_sin_descuento

            });

        } else {
            throw new Error("No se encontro la matricula");
        }


    } catch (error) {
        return res.status(500).json({
            error: true,
            message: error.message
        });
    }



}