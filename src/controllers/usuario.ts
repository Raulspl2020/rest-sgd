import { response } from 'express';
import { enviaMail } from '../helpers/mail';
import { comprobarJWT, generarJWT } from '../helpers/jwt';

import * as usuarioProvider from '../provider/usuario_provider';
import { updateDatauserContact, updatePersonaCodeVerify } from '../provider/usuario_provider';
import { Usuario } from '../models/Usuario';
import { validar } from '../provider/login_provider';
import { updatePass } from '../provider/login_provider';
import { extractColDocumentData } from '../helpers/global';
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
//   /usuario/infobasica/:id_user
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
        email_persona?: string;
        email_institucion?: string;
        cel_persona?: string;
    }

    try {
        let result: UserBasicInfo[] = await usuarioProvider.getInfoUsuario(ideUsuario);
        console.log(result);

        let json: any = {};
        if (result.length > 0) {

            result[0].apellido2 = (result[0].apellido2 == null) ? "" : result[0].apellido2;
            result[0].nombre2 = result[0].nombre2 || "";
            result[0].email_persona = result[0].email_persona.trim() ?? result[0].email_institucion.trim();
            result[0].cel_persona = result[0].cel_persona.trim();

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




//====================
//   /usuario/infobasica
//=====================
export const getInfoBasicUsuario = async (req: any, res = response) => {
    let ideUsuario: string = req.params.ideUsuario;
    const usuario: Usuario = req.usuario;

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
        cel_persona?: string;
        email_persona?: string;
        email_institucion?: string;
    }

    try {
        let result: UserBasicInfo[] = await usuarioProvider.getInfoUsuario(usuario.id);
        console.log(result);

        if (result.length > 0) {

            result[0].apellido2 = (result[0].apellido2 == null) ? "" : result[0].apellido2;
            result[0].nombre2 = result[0].nombre2 || "";
            result[0].email_persona = result[0].email_persona.trim() ?? result[0].email_institucion.trim();
            result[0].cel_persona = result[0].cel_persona.trim();

            res.status(200).json({
                message: "Ejecución correcta",
                data: result[0],
                error: false,
            });
        } else {
            res.status(404).json({
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
//   /usuario/contacto 
//=====================
export const updateContactUser = async (req: any, res = response) => {
    const usuario: Usuario = req.usuario;
    const body = req.body;
    try {
        const data = {
            cel_persona: body.cel_persona,
            email_persona: body.email_persona,
            dir_persona: body.dir_persona,
            email_institucion: body.email_institucion

        };

        let result = await updateDatauserContact(usuario.id, data);
        console.log(result);

        res.status(200).json({
            message: "Datos actualizados correctamente",
            error: false,
        });



    } catch (error) {
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error: error.message,
        });
    }
}




//====================
//  POST /usuario/changepassword 
//=====================
export const changePassword = async (req: any, res = response) => {
    const usuario: Usuario = req.usuario;
    const body = req.body;
    try {
        const data = {
            password_old: body.password_old,
            password_new: body.password_new,

        };

        let row = await validar(usuario.id, data.password_old);

        if (row[0].length > 0) {
            let result = await updatePass(usuario.id, data.password_new);

            res.status(200).json({
                message: "Contraseña actualizada exitosamente",
                error: false,
                result
            });

        } else {
            res.status(406).json({
                message: "Contraseña anterior incorrecta",
                error: true,
            });
        }


    } catch (det_error) {
        console.log(det_error);
        res.status(500).json({
            message: "Algo salio mal",
            error: true,
            det_error
        });
    }
}




//====================
//   /usuario/updateinfouser 
//=====================
export const updateInfoUser = async (req: any, res = response) => {
    let body = req.body;

    try {

        let codigo: number = parseInt((Math.random() * (9999 - 1000) + 1000).toString());

        let newJWT = await generarJWT({
            'id_usuario': body.id_usuario,
            'email': body.email,
            'celular': body.celular,
            'direccion': body.direccion,
            'codigo': codigo
        }, '5m');

        updatePersonaCodeVerify(body.id_usuario, codigo);

        const mailAuth = {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS,
        };

        let dataMail = {
            from_name: body.from_name,
            enviar_a: body.email,
            asunto: "Verificación correco electronico - Código: " + codigo,
            mensaje: `
Cordial saludo,

<p>Número de verificación: <strong><h3>${codigo}</h3></strong></p>

<p>Este correo electrónico se ha enviado de forma automática para confirmar la
identidad del usuario que ha solicitado registrar una dirección de correo electrónico en SIGEDIN.<p>

<p>
Para continuar con el registro en SIGEDIN de la dirección del correo electrónico ${body.email},
usa el numero de verificación o haz click sobre el boton.</p>

<a href="${process.env.BASE_URL}/usuario/verifytokenmail/${newJWT}" style="display:block;width:90%;max-width:350px;line-height:45px;border-radius:5px;background:#e67e22;color:white;text-align:center;margin:2em auto 1em" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://dashboard.epayco.co/api/registro/crear/cliente/5c72d08f77159a0930e5533e17512e21&amp;source=gmail&amp;ust=1630080987404000&amp;usg=AFQjCNG-Ejm3JqcXyREg5IOTHMVn2sHGbQ">Validar Correo</a>

<p>
*Si confirmas este correo electrónico desde iPhone o Android pulsa el
siguiente enlace para proceder con la confirmación. </p>

${process.env.BASE_URL}/usuario/verifytokenmail/${newJWT}
        `
        };


        let mailOptions = {
            'from': `Sigedin-ITP <${mailAuth.user}>`,
            'to': dataMail.enviar_a,
            'subject': dataMail.asunto,
            'html': dataMail.mensaje
            //'text': dataMail.mensaje
        };

        let response = await enviaMail(mailOptions, mailAuth);

        if (!response) {
            res.status(401).json({
                message: response,
                error: true,
            });
        } else {
            res.status(200).json({
                message: "E-mail de verificación enviado exitosamente, por favor revisa tu correo electrónico",
                error: false,
                token: newJWT,
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Servicio no disponible temporalmente",
            error: true
        });
    }
}

//====================
//   /usuario/verifytokenmail 
//=====================
export const verifyTokenMail = async (req: any, res = response) => {
    let body = req.body;
    let tokenMail = req.params.token;

    let usuario: any = {};


    try {

        let [valido, dataToken] = comprobarJWT(tokenMail);

        if (valido) {
            usuario = dataToken?.usuario;
            usuario.mensaje = "";
            usuario.valido = valido;
            //actualizar datos en ña DB

            let dataDB = {
                'email_persona': usuario.email,
                'dir_persona': usuario.direccion,
                'cel_persona': usuario.celular,
                'email_verify': '1',
                'codigo_activacion': 0
            };
            if (usuario.direccion == '') {
                delete dataDB.dir_persona;
            }
            if (usuario.celular == '') {
                delete dataDB.cel_persona;
            }


            let resultDB = await updateDatauserContact(usuario.id_usuario, dataDB);

            res.render('estado_verificacion_email', usuario);


        } else {
            usuario.valido = valido;
            usuario.mensaje = "EL token de verificación o codigo de activación ha expirado";
            res.render('estado_verificacion_email', usuario);
        }


    } catch (error) {
        console.log(error);
        usuario.mensaje = "Servcio no disponible temporalmemte";
        res.render('estado_verificacion_email', usuario);
    }
}
//====================
//   /usuario/decodecedula 
//=====================
export const getDataCedula = async (req: any, res = response) => {

    let body = req.body;

    let cadena: string = body.cadenabase64;


    if (cadena.length < 20) {

        res.status(200).json({
            message: "Lectura errada, intente nuevamente",
            error: true,
            data: {},
        });

    }


    try {

        let buff: Buffer = Buffer.from(cadena, 'base64');
        const decodeCadena: string = buff.toString('ascii');

        res.status(200).json({
            message: "Decodificación correcta",
            error: false,
            data: extractColDocumentData(decodeCadena),
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Servicio no disponible temporalmente ",
            error: true
        });
    }
}
