// Interfaz para el objeto de respuesta de pago
export interface IDecodedPago {
  int_ped_numero: number;
  int_n_pago: number;
  int_pago_parcial: number;
  int_pago_terminado: number;
  int_estado_pago: number;
  dbl_valor_pagado: number;
  dbl_total_pago: number;
  dbl_valor_iva_pagado: number;
  str_descripcion: string;
  str_id_cliente: string;
  str_nombre: string;
  str_apellido: string;
  str_telefono: string;
  str_email: string;
  str_campo1: string;
  str_campo2: string;
  str_campo3: string;
  str_campo4: string;
  str_campo5: string;
  dat_fecha: string;
  int_id_forma_pago: number;

  // Si el medio de pago es 29
  str_ticketID?: string; // medio de pago 29 o 32
  int_codigo_servicio?: number; // solo 29
  int_codigo_banco?: number; // solo 29
  str_nombre_banco?: string; // solo 29
  str_codigo_transacción?: string; // solo 29
  int_ciclo_transacción?: number; // solo 29

  // Si el medio de pago es 32
  int_numero_tarjeta?: number; // solo 32
  str_franquicia?: string; // solo 32
  int_cod_aprobacion?: string; // solo 32
  int_num_recibido?: string; // solo 32
}

export function decodePagoToList(cadena: string): IDecodedPago[] {
  const datos = cadena.split("|");
  let row: string[] = [];
  const matriz: string[][] = [];

  datos.forEach((element) => {
    if (element.trim().indexOf(";") !== -1) {
      matriz.push(row);
      row = [];
      const aux = element.trim().split(" ");
      row.push(aux[1] || "");
    } else {
      row.push(element.trim());
    }
  });

  const listapagos: IDecodedPago[] = [];

  matriz.forEach((dato) => {
    const pago: IDecodedPago = {
      int_ped_numero: Number(dato[0]),
      int_n_pago: Number(dato[1]),
      int_pago_parcial: Number(dato[2]),
      int_pago_terminado: Number(dato[3]),
      int_estado_pago: Number(dato[4]),
      dbl_valor_pagado: Number(dato[5]),
      dbl_total_pago: Number(dato[6]),
      dbl_valor_iva_pagado: Number(dato[7]),
      str_descripcion: dato[8],
      str_id_cliente: dato[9],
      str_nombre: dato[10],
      str_apellido: dato[11],
      str_telefono: dato[12],
      str_email: dato[13],
      str_campo1: dato[14],
      str_campo2: dato[15],
      str_campo3: dato[16],
      str_campo4: dato[17],
      str_campo5: dato[18],
      dat_fecha: dato[19],
      int_id_forma_pago: Number(dato[20]),
    };

    // Si el medio de pago es 29
    if (pago.int_id_forma_pago === 29) {
      pago.str_ticketID = dato[21];
      pago.int_codigo_servicio = Number(dato[22]);
      pago.int_codigo_banco = Number(dato[23]);
      pago.str_nombre_banco = dato[24];
      pago.str_codigo_transacción = dato[25];
      pago.int_ciclo_transacción = Number(dato[26]);
    }

    // Si el medio de pago es 32
    if (pago.int_id_forma_pago === 32) {
      pago.str_ticketID = dato[21];
      pago.int_numero_tarjeta = Number(dato[22]);
      pago.str_franquicia = dato[23];
      pago.int_cod_aprobacion = dato[24];
      pago.int_num_recibido = dato[25];
    }

    listapagos.push(pago);
  });
  return listapagos;
}
