import jwt from 'jsonwebtoken';
import { authTokenService } from '../provider/login_provider';

export const verificaToken = (req: any, res: any, next: any) => {

    let token = req.get('token');
    jwt.verify(token, process.env.SECRET_KEY, (err: any, decoded: any) => {
        console.log('token: ' + decoded);
        if (err) {
            return res.status(401).json({
                error: true,
                data: err,
                message: "Token invalido"
            });
        }
        req.usuario = decoded.usuario;
        next();
    });

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

