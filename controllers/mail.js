const { enviaMail } = require("../helpers/mail");
const { response } = require("express");
const estudianteProvider = require("../provider/estudiante_provider");

//====================
//   /mail/enviacorreo
//=====================
const enviaEMail = async (req, res = response) => {
  let body = req.body;

  let fileBuffer = [];

  //validamos si hay archivo adjunto
  if (!req.files) {
    fileBuffer = null;
  } else {
    let files = req.files.archivo;
    files.forEach((element, index) => {
      fileBuffer[index] = {
        filename: element.name,
        content: element.data,
      };
    });
  }

  const mailAuth = {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  };
  console.log(mailAuth);

  let dataMail = {
    from_name: body.from_name,
    enviar_a: body.enviar_a,
    asunto: body.asunto,
    mensaje: body.mensaje,
    key: body.key,
  };

  if (process.env.EMAIL_KEY != dataMail.key) {
    res.status(401).json({
      message: "Usuario no autorizado",
      error: true,
    });
    return;
  }

  let mailOptions = {
    from: `Sigedin-ITP <${mailAuth.user}>`,
    to: dataMail.enviar_a,
    subject: dataMail.asunto,
    // 'html': dataMail.mensaje
    text: dataMail.mensaje,
    attachments: fileBuffer,
  };

  try {
    let response = await enviaMail(mailOptions, mailAuth);
    console.log("imprimendo respuesta");
    console.log(response);
    if (!response) {
      res.status(401).json({
        message: response,
        error: true,
      });
    } else {
      res.status(200).json({
        message: "E-mail enviado exitosamente",
        error: false,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error al enviar el email",
      data: error,
      error: true,
    });
  }
};

//====================
//   /mail/consulta_correo
//=====================
const consultaCorreo = async (req, res = response) => {
  let ide_estudiante = req.params.ide_estudiante;

  try {
    let result = await estudianteProvider.getCorreoEstudiante(ide_estudiante);

    if (result != undefined) {
      return res.status(200).json({
        error: false,
        data: result,
      });
    } else {
      data = {
        message: "No se encontraron resultados",
        error: true,
      };
      res.status(400).json(data);
    }
  } catch (error) {
    res.json({
      error: true,
      message: error.message,
    });
  }
};

module.exports = {
  enviaEMail,
  consultaCorreo,
};
