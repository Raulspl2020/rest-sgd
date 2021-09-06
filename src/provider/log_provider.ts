import { conDB } from "../config/database";

export const guardarLog = async (dataInsert: any) => {
  let result = conDB("fin_request_log").insert(dataInsert);
  return result;

};


//guarda el el detalle del la ejecucion en la funcion encargada de guardar facturas en sysapolo
export const guardarLogFacturaSys = async (dataInsert: any) => {
  let result = conDB("fin_factura_sysapolo_log").insert(dataInsert);
  return result;
};



