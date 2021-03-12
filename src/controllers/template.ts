import { response } from 'express';

//====================
//   /page/inicio 
//=====================
export const vistaHolaMundo = async(req:any, res = response) => {
    

    res.render("hola_mundo");

};


//====================
//   /page/PagoPersonalizado 
//=====================
export const pagoPersonalizado = async(req:any, res = response) => {
    let data: any ={};
    data.BASE_URL = process.env.BASE_URL.toString();
    res.render("pago_general",data);

};