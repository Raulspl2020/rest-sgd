import { ResponsePago } from "../models/ResponsePago";
import fetch from "node-fetch";
import JsBarcode from "jsbarcode";

import { DOMImplementation, XMLSerializer } from "xmldom";
export const decodeResPago = (cadena: string) => {

  let datos = cadena.split("|");
  // console.log(datos);
  let row: any = [];
  let matriz: Array<any> = [];
  datos.forEach(element => {

    if ((element.trim().indexOf(';') != -1)) {
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

      "str_ticketID": dato[21],
      "int_codigo_servicio": dato[22],
      "int_codigo_banco": dato[23],
      "str_nombre_banco": dato[24],
      "str_codigo_transacción": dato[25],
      "int_ciclo_transacción": dato[26]
    });


    listapagos.push(responsePago);


  });
  return listapagos;
};



export const limpiarCampos = (cadena: string) => {
  if (cadena == undefined) {
    cadena = "";
  }
  return cadena.toString().replace(/[`~!@#$%^&*¬()_|\-=?;:'",.<>\{\}\[\]\\\/]/gim, '');
}

export const dataConfigPago = (infoPago: any) => {

  let data: any = {
    InformacionPago: infoPago,
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
        //str_valor: "2701", para desarrollo
        //str_valor: "1001", // para produccion
        str_valor: (process.env.NODE_ENV=='pro') ? "1001" : "2701"
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
        str_valor: "https://sigedin.itp.edu.co/",
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
        int_codigo: 109, //activa el campo editable
        str_valor: "0",
      },
      {
        int_codigo: 110,
        str_valor: "0",
      },
    ],
  };

  return data;
};


export const ejecutarZonaPagos = async (body: any, path: string) => {
  //INICAMOS EL PAGO CON ZONAPAGOS
  console.log("inicia peticion en zonapagos");
  try {
    let responseZona = await fetch(process.env.ZONAPAGOS_URL + "/" + path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    let responseData = await responseZona.json();
    console.log("Finaliza peticion zonapagos");
    return responseData;

  } catch (error) {
    console.log(error);
    return {
      "int_estado": 1,
      "int_error": -1
    }
  }
};


export const generarCodigoBarrasText = async (referencia: string, valor: string, fecha: any) => {
  const convenio415: string = "0000000025854";
  let referencia8020: string = referencia.toString();


  let valor390n: string = valor.toString();
  let [dia, mes, año]: string = fecha.split('-');

  const fecha96: string = año + mes + dia;

  const length8020: number = 12;
  const length390n: number = 10;

  try {
    if (referencia8020.length < length8020) {
      let faltante = length8020 - referencia8020.length;
      for (let i = 0; i < faltante; i++) {
        referencia8020 = "0" + referencia8020;
      }
    } else if (referencia8020.length > length8020) {
      throw new Error("El codigo de referencia supera el máximo permitido");
    }

    if (valor390n.length < length390n) {
      let faltante = length390n - valor390n.length;
      for (let i = 0; i < faltante; i++) {
        valor390n = "0" + valor390n;
      }
    } else if (valor390n.length > length390n) {
      throw new Error("El valor supera el máximo permitido");
    }

    let codigoBarras = "415" + convenio415 + "8020" + referencia8020 + "3900" + valor390n + "96" + fecha96;
    let text = "(415)" + convenio415 + "(8020)" + referencia8020 + "(3900)" + valor390n + "(96)" + fecha96;
    return [codigoBarras, text];


  } catch (error) {
    return [null, null];
  }
}

export const dividirCodigoBarrasText = async (cadena: string) => {
  let convenio415 = cadena.substr(0, 16);
  let referencia8020 = cadena.substr(16, 16);
  let valor3900 = cadena.substr(16 + 16, 14);
  let fecha96 = cadena.substr(16 + 16 + 14, 10);
  return [convenio415,
    referencia8020,
    valor3900,
    fecha96];
}


export const generarCodigoBarras = async (referencia: string, valor: string, fecha: any) => {
  try {
    // console.log("referencia",referencia);
    // console.log("valor",valor);
    // console.log("fecha",fecha);
    let [codigoBarras, text] = await generarCodigoBarrasText(referencia, valor, fecha);
    const xmlSerializer = new XMLSerializer();
    const document = new DOMImplementation().createDocument("http://www.w3.org/1999/xhtml", "html", null);
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    JsBarcode(svgNode, codigoBarras, {
      xmlDocument: document,
      height: 50,
      width: 1.13,
      fontSize: 10,
      text: text,
      margin: 2,
    });

    const svgText = xmlSerializer.serializeToString(svgNode);

    return [codigoBarras, svgText];

  } catch (error) {
    return [null, null];
  }


};



