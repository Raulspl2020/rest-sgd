import jwt from 'jsonwebtoken';
import { Usuario } from '../models/Usuario';
import Sesion from '../models/Mongo/Sesion';
import { authTokenService } from '../provider/login_provider';
import { comprobarJWT, decodingJWT, generarJWT } from '../helpers/jwt';
import { v4 as uuidv4 } from 'uuid';

export const verificaToken = async (req: any, res: any, next: any) => {

    try {
        let token = req.get('token');
        console.log(token);
        const { usuario, exp }: { usuario: Usuario, exp: number } = await decodingJWT(token);
        req.usuario = usuario;
        let [esValido, data] = comprobarJWT(token);

        if (esValido) {

            let sesion = await Sesion.findOne({ sesion_id: usuario.sesion_id, token: token});
            if (!sesion) {
                return res.status(401).json({
                    error: true,
                    message: "Sesion expirada"
                });
            } else {
                return next();
            }
        }


        //renovar token solo si ya expiro
        if (data.name === 'TokenExpiredError') {
            console.log("el token expiro");

            let sesion = await Sesion.findOne({ sesion_id: usuario.sesion_id, token: token });
            if (!sesion) {
                return res.status(401).json({
                    error: true,
                    message: "Sesion expirada"
                });
            } else {

                let refreshToken = await generarJWT(usuario);
                const { exp } = await decodingJWT(refreshToken);
                
                sesion.token = refreshToken;
                sesion.fecha_caducidad = new Date(exp * 1000);
                await sesion.save();
                res.set('refresh-token', refreshToken);
                return next();
            }

        } else {
            return res.status(401).json({
                error: true,
                data,
                message: "Token invalido"
            });

        }

    } catch (error) {
        console.log(error);
        return res.status(401).json({
            error: true,
            message: "Token invalido, error interno"
        });
    }


};


export const verificaTokenDB = (scope: string) => async (req: any, res: any, next: any) => {

    let token = req.get('token');

    try {
        if (!token) {
            throw new Error("El token es obligatorio");
        }
        let resultDB = await authTokenService(scope, token);
        if (resultDB.length > 0) {
            next();
        } else {
            throw new Error("Permiso denegado");
        }
    } catch (error) {
        return res.status(401).json({
            error: true,
            message: error.message
        });
    }


};


export const renovarToken = (scope: string) => async (req: any, res: any, next: any) => {

    let token = req.get('token');

    try {
        if (!token) {
            throw new Error("El token es obligatorio");
        }
        let resultDB = await authTokenService(scope, token);
        if (resultDB.length > 0) {
            next();
        } else {
            throw new Error("Permiso denegado");
        }
    } catch (error) {
        return res.status(401).json({
            error: true,
            message: error.message
        });
    }


};

