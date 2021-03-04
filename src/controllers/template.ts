import { response } from 'express';

//====================
//   /page/inicio 
//=====================
export const vistaHolaMundo = async(req:any, res = response) => {
    

    res.render("hola_mundo");

};
