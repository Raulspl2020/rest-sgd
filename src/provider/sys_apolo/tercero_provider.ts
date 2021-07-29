import { conSysApolo } from "../../config/database";

export const consultarTercero =  async ()=> {
        const cnn = await conSysApolo();
        const result = await cnn.query`select * from centro_costo`
        return result.recordset;
}