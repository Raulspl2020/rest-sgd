import { conDB } from '../config/database';

export  const guardarPago = async(params : any) => {
    let result = await conDB('fin_pago').insert(params);
    return result;
};