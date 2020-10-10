const jwt = require('jsonwebtoken');

let verificaToken = (req, res, next) => {

    let token = req.get('token');
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
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

module.exports = {
    verificaToken
};