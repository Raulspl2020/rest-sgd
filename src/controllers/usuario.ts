import { response } from 'express';

import * as usuarioProvider from '../provider/usuario_provider';
//====================
//   /usuario/auditoria 
//=====================
export const getAuditoriaUsuario = async (req: any, res = response) => {
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


//====================
//   /usuario/contacto 
//=====================
export const getUserContacto = async (req: any, res = response) => {
    let body = req.body;
    let ideUsuario = req.params.ideUsuario;

    try {
        let result = await usuarioProvider.contactoUsuatio(ideUsuario);

        let json: any = {};
        if (result[0].length > 0) {

            res.status(200).json({
                message: json.msj,
                data: result[0][0],
                error: false,
            });
        } else {
            res.status(200).json({
                message: "No se encontraron resultados",
                error: true,
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error,
        });
    }

};




//====================
//   /usuario/contacto 
//=====================
export const getInfoUser = async (req: any, res = response) => {
    let body = req.body;
    let ideUsuario = req.params.ideUsuario;

    try {
        let result = await usuarioProvider.getInfoUsuario(ideUsuario);

        let json: any = {};
        if (result[0].length > 0) {

            res.status(200).json({
                message: json.msj,
                data: result[0][0],
                error: false,
            });
        } else {
            res.status(200).json({
                message: "No se encontraron resultados",
                error: true,
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error.message,
        });
    }

};




//====================
//   /usuario/infobasica 
//=====================
export const getInfoBasicUser = async (req: any, res = response) => {
    let body = req.body;
    let ideUsuario = req.params.ideUsuario;

    interface UserBasicInfo {
        ide_persona: string;
        tipo_doc: string;
        des_tipo_doc: string;
        apellido1: string;
        apellido2?: string;
        nombre1: string;
        nombre2?: string;
        fech_nac_persona?: string;
        fec_expedicion_doc?: string;
    }

    try {
        let result:UserBasicInfo[] = await usuarioProvider.getInfoUsuario(ideUsuario);
        console.log(result);

        let json: any = {};
        if (result.length > 0) {

            result[0].apellido2 =  (result[0].apellido2==null) ? "": result[0].apellido2;
            result[0].nombre2 = result[0].nombre2 || "";

            res.status(200).json({
                message: "Ejecución correcta",
                data: result[0],
                error: false,
            });
        } else {
            res.status(200).json({
                message: "No se encontraron resultados",
                error: true,
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error.message,
        });
    }

};
