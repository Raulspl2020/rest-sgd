const jwt = require("jsonwebtoken");

export const generarJWT = (payload:any, caducidad = process.env.CADUCIDAD_TOKEN) : Promise<string> => {
    return new Promise((resolve, reject) => {

        jwt.sign({ usuario: payload }, process.env.SECRET_KEY, { expiresIn: caducidad, }, (err:any, token:string) => {
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


export const crearTokenAux = async function(data:any, ex:any) {
    var caducidad = 60 * 15; //tiempo de vida del toquen 10min 60 * 10
    let token = await jwt.sign(data, process.env.SECRET_KEY, { expiresIn: caducidad });
    return token;
};


export const comprobarJWT = (token:string) => {
    try {
        const data = jwt.verify(token, process.env.SECRET_KEY);
        return [true, data];
    } catch (error) {
        return [false, error];
    }
};

export const decodingJWT = (token:string) => {
    console.log('decoding JWT token');
    if (token !== null || token !== undefined) {
        // const base64String = token.split('.')[1];
        // const decodedValue = JSON.parse(Buffer.from(base64String, 'base64').toString('ascii'));
        // console.log(decodedValue);
        return jwt.decode(token);
    }
    return null;
}

