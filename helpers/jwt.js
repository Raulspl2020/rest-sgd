const jwt = require("jsonwebtoken");

const generarJWT = (payload) => {
  return new Promise((resolve, reject) => {
    console.log(payload);
    
    jwt.sign({usuario: payload},process.env.SECRET_KEY,{expiresIn: "24h",},(err, token) => {
        if (err) {
          //no se pudo crear el token
          reject("No se pudo crear el token");
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


var verificaToken = function(token) {
  var tk = token;
  var info = {};

  try {
      jwt.verify(tk, process.env.SECRET_KEY, (err, decoded) => {

          if (err) {
              console.log('tokensdsdxd: ' + err);
              info = {
                  'error': true,
                  'message': "Token invalido",
                  'log': err
              };

          } else {

              info = {
                  'error': false,
                  'message': "Token correcto",
                  'data': decoded,
                  'token': token
              };
          }

      });
  } catch (err) {
      console.log(err);
  }

  return info;
};

//un no se usa
const comprobarJWT = (token = "") => {
  try {
    const { uid } = jwt.verify(token, process.env.SECRET_KEY);
    return [true, uid];
  } catch (error) {
    return [false,null];
  }
};

module.exports = {
  generarJWT,
  comprobarJWT,
  crearTokenAux,
  verificaToken
};
