import { enviaMail } from "../helpers/mail";
import { response } from "express";
import * as estudianteProvider from "../provider/estudiante_provider";

//====================
//   /mail/enviacorreo
//=====================
export const enviaEMail = async (req:any, res = response) => {
  let body = req.body;

  let fileBuffer : any = [];

  //validamos si hay archivo adjunto
  if (!req.files) {
    fileBuffer = null;
  } else {
    let files = req.files.archivo;
    files.forEach((element:any, index:number) => {
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
export const consultaCorreo = async (req:any, res = response) => {
  let ide_estudiante = req.params.ide_estudiante;
  let data: any = {};
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


