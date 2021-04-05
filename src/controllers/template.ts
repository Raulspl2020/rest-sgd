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
//====================
//   /page/pagoMatricula 
//=====================
export const pagoMatricula = async(req:any, res = response) => {
    let id_matricula = req.params.id_matricula;
    console.log(id_matricula);
    let data: any ={};
    data.BASE_URL = process.env.BASE_URL.toString();
    data.ID_MATRICULA = id_matricula;
    res.render("pago_matricula",data);

};