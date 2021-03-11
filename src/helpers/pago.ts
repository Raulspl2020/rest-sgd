import { ResponsePago } from "../models/ResponsePago";
export const decodeResPago = (cadena: string) => {

    let datos = cadena.split("|");
    // console.log(datos);
    let row: any = [];
    let matriz: Array<any> = [];
    datos.forEach(element => {

        if ((element.trim().indexOf(';') != -1) && (element.trim().length <= 3)) {
            matriz.push(row);
            row = [];
            let aux = element.trim().split(' ');

            if (aux.length > 1) {
                row.push(aux[1]);
            } else {
                row.push("");
            }
        } else {
            row.push(element.trim());
        }

    });

    let listapagos: Array<ResponsePago> = [];

    matriz.forEach(dato => {

        let responsePago = new ResponsePago({
            "int_ped_numero": dato[0],
            "int_n_pago": dato[1],
            "int_pago_parcial": dato[2],
            "int_pago_terminado": dato[3],
            "int_estado_pago": dato[4],
            "dbl_valor_pagado": dato[5],
            "dbl_total_pago": dato[6],
            "dbl_valor_iva_pagado": dato[7],
            "str_descripcion": dato[8],
            "str_id_cliente": dato[9],
            "str_nombre": dato[10],
            "str_apellido": dato[11],
            "str_telefono": dato[12],
            "str_email": dato[13],
            "str_campo1": dato[14],
            "str_campo2": dato[15],
            "str_campo3": dato[16],
            "str_campo4": dato[17],
            "str_campo5": dato[18],
            "dat_fecha": dato[19],
            "int_id_forma_pago": dato[20],
            "str_ticketID":  dato[21],
            "int_codigo_servicio":  dato[22],
            "int_codigo_banco":  dato[23],
            "str_nombre_banco":  dato[24],
            "str_codigo_transacción":  dato[25],
            "int_ciclo_transacción":  dato[26]
        });

        listapagos.push(responsePago);


    });
    return listapagos;
};


export const dataConfigPago = (infoPago: any) => {

    let data: any = {
        InformacionPago : infoPago,
        InformacionSeguridad: {
          int_id_comercio: process.env.ZONAPAGOS_ID,
          str_usuario: process.env.ZONAPAGOS_USER,
          str_clave: process.env.ZONAPAGOS_PASS,
          int_modalidad: 1,
        },
        AdicionalesPago: [
          {
            int_codigo: 111,
            str_valor: "0",
          },
          {
            int_codigo: 112,
            str_valor: "0",
          },
        ],
        AdicionalesConfiguracion: [
          {
            int_codigo: 50,
            str_valor: "2701",
          },
          {
            int_codigo: 100,
            str_valor: "1",
          },
          {
            int_codigo: 101,
            str_valor: "1",
          },
          {
            int_codigo: 102,
            str_valor: "1",
          },
          {
            int_codigo: 103,
            str_valor: "0",
          },
          {
            int_codigo: 104,
            str_valor: "https://www.google.com.co/",
          },
          {
            int_codigo: 105,
            str_valor: "1",
          },
          {
            int_codigo: 106,
            str_valor: "3",
          },
          {
            int_codigo: 107,
            str_valor: "0",
          },
          {
            int_codigo: 108,
            str_valor: "1",
          },
          {
            int_codigo: 109,
            str_valor: "1",
          },
          {
            int_codigo: 110,
            str_valor: "0",
          },
        ],
      };

      return data;
};

