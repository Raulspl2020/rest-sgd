import { response } from 'express';

import * as usuarioProvider from '../provider/usuario_provider';
//====================
//   /usuario/auditoria 
//=====================
export const getAuditoriaUsuario = async(req:any, res = response) => {
    let body = req.body;
    console.log(req);
    let ideUsuario = req.params.ideUsuario;
    
    usuarioProvider.auditoria(ideUsuario)
        .then(rows => {
            let json = {};
            if (rows.length) {

                json = {
                    data: rows,
                    rs: true,
                }
            } else {
                json = {
                    msj: "No se encontraron resultados",
                    rs: false
                }
            }

            res.json(json);
        });

};
