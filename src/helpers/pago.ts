import { ResponsePago } from "../models/ResponsePago";
import path from 'path';

export const decodeResPago = (cadena: string) => {


    let datos = cadena.split("|");
   // console.log(datos);
    let row: any = [];
    let matriz:Array<any> = [];
    datos.forEach(element => {

        if ((element.trim().indexOf(';') != -1) && (element.trim().length<=3)) {
            matriz.push(row);
            row=[];
            let aux = element.trim().split(' ');

            if(aux.length>1){
                row.push(aux[1]);
            }else{
                row.push("");
            }
            console.log(row);
            
          
        } else {
            row.push(element.trim());
            console.log("________________");
          //  console.log(row);
        }

      

    });

  // console.log(matriz);

    let listapagos:Array<ResponsePago> = [];

    matriz.forEach(dato => {

        let responsePago = new ResponsePago({
            "int_ped_numero" :  dato[0],
            "int_n_pago" :   dato[1],
            "int_pago_parcial" :  dato[2],
            "int_pago_terminado" :  dato[3],
            "int_estado_pago" :  dato[4],
            "dbl_valor_pagado" :  dato[5],
            "dbl_total_pago" :  dato[6],
            "dbl_valor_iva_pagado" :  dato[7],
            "str_descripcion" :  dato[8],
            "str_id_cliente" :  dato[9],
            "str_nombre" :  dato[10],
            "str_apellido" :  dato[11],
            "str_telefono" :  dato[12],
            "str_email" :  dato[13],
            "str_campo1" :  dato[14],
            "str_campo2" :  dato[15],
            "str_campo3" :  dato[16],
            "str_campo4" :  dato[17],
            "str_campo5" :  dato[18],
            "dat_fecha" :  dato[19],
            "int_id_forma_pago" :  dato[20],
            "str_ticketID" :  "",
            "int_codigo_servicio" :  "",
            "int_codigo_banco" :  "",
            "str_nombre_banco" :  "",
            "str_codigo_transacción" : "",
            "int_ciclo_transacción" : ""
        });

        listapagos.push(responsePago);


    });
    return listapagos;



};

