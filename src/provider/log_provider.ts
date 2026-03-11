import { conDB } from "../config/database";

export const guardarLog = async (dataInsert: any) => {
  try {
    let result = await conDB("fin_request_log").insert(dataInsert);
    return result;
  } catch (error) {
    console.error("Error al guardar log:", error);
    return null;
  }
};


//guarda el el detalle del la ejecucion en la funcion encargada de guardar facturas en sysapolo
export const guardarLogFacturaSys = async (dataInsert: any) => {
  try {
    let result = await conDB("fin_factura_sysapolo_log").insert(dataInsert);
    return result;
  } catch (error) {
    console.error("Error al guardar log sysapolo:", error);
    return null;
  }
};



