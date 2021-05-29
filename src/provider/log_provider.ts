import { conDB } from "../config/database";

export const guardarLog = async (dataInsert:any) => {
    let result = conDB("fin_request_log").insert(dataInsert);
    return result;
    
  };