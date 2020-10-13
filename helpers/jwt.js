const jwt = require("jsonwebtoken");

const generarJWT = (payload, caducidad = process.env.CADUCIDAD_TOKEN) => {
    return new Promise((resolve, reject) => {

        jwt.sign({ usuario: payload }, process.env.SECRET_KEY, { expiresIn: caducidad, }, (err, token) => {
            if (err) {
                //no se pudo crear el token
                reject("No se pudo crear el token, " + err.message);
            } else {
                //TOKEN
                resolve(token);
            }
        });

    });
};


let crearTokenAux = async function(data, ex) {
    var caducidad = 60 * 15; //tiempo de vida del toquen 10min 60 * 10
    let token = await jwt.sign(data, process.env.SECRET_KEY, { expiresIn: caducidad });
    return token;
};


const comprobarJWT = (token = "") => {
    try {
        const data = jwt.verify(token, process.env.SECRET_KEY);
        return [true, data];
    } catch (error) {
        return [false, null];
    }
};

module.exports = {
    generarJWT,
    comprobarJWT,
    crearTokenAux
};