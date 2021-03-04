import jwt from 'jsonwebtoken';

export const verificaToken = (req:any, res:any, next:any) => {

    let token = req.get('token');
    jwt.verify(token, process.env.SECRET_KEY, (err:any, decoded:any) => {
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
