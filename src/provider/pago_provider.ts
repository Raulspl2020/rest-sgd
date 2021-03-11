
import { conDB } from '../config/database';



export const guardarPago = async (params: any) => {
    let result = await conDB('fin_pago').insert(params);
    return result;
};


export const getConceptos = async (ids: any) => {
    let result = await conDB.select('_id','codigo','descripcion','valor').from('fin_concepto')
    .whereIn('_id', ids);
    return result;
};


export const getConceptosPaquete = async (id: any) => {
    let result = await conDB('fin_paquete')
    .join('fin_detalle_paquete', 'fin_paquete._id', '=', 'fin_detalle_paquete.paquete_id')
    .select('fin_paquete._id','fin_paquete.descripcion','fin_paquete.tipo','fin_detalle_paquete._id','fin_detalle_paquete.valor_unidad','fin_detalle_paquete.cantidad','fin_detalle_paquete.descuento','fin_detalle_paquete.aumento')
    .where('fin_paquete._id', id);
    return result;
};



export const guardarPagoyDetalle = async (params: any, tDetallePago:any) => {

    let id =0;
    const trx = await conDB.transaction();
    return await trx('fin_pago')
        .insert(params)
        .then((ids: any) => {
            let detalle: any = tDetallePago;

            detalle.forEach((det: any) => det.pago_id = ids[0]);
            id = ids;
            return trx('fin_detalle_factura').insert(detalle);
        })

        .then((result:any)=>{
             trx.commit();
             return id;
        })
        .catch((result:any)=>{
            trx.rollback();
            return false;
        });



};


