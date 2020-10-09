const { response } = require("express");
const { validarGoogleIdToken } = require("../helpers/google-verify-token");
const login_model = require("../models/login_model");


const { generarJWT } = require("../helpers/jwt");

const googleAuth = async (req, res) => {
  let token = req.body.token;

  if (!token) {
    return res.json({
      ok: false,
      msg: "Token requerido",
    });
  }

  const googleUser = await validarGoogleIdToken(token);

  if (!googleAuth) {
    return res.status().json({
      ok: false,
    });
  }

  //guardar en base de datos

  res.json({
    ok: true,
    googleUser,
  });
};


const login = async (req, res = response) => {
  const { user, pass } = req.body;
  let data = {};
  let codeStatus = 200;

  console.log(req.body);

  try {
    let row = await login_model.validar(user, pass);

    if (row[0].length > 0) {
      let saludo = "Bienvenido";
      let token = await generarJWT(row[0]);

      data = {
        data: row[0],
        message: `${saludo} ${row[0][0].name}`,
        error: false,
        token: token,
      };
      codeStatus = 202;
    } else {
      data = {
        message: "Usuario o contraseña incorrectos",
        error: true,
      };
      codeStatus = 401;
    }

    res.status(codeStatus).json(data);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error,
    });
  }
};

//corregir esto
const renewToken = async (req, res = response) => {
  const uid = req.uid;
  const token = await generarJWT(uid);
  const usuario = await Usuario.findById(uid);

  res.json({
    ok: true,
    token,
    usuario,
  });
};

module.exports = {
  googleAuth,
  login,
  renewToken,
};
