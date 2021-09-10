import { Request, Response } from "express";
import express from "express";
const app = express();

import routerMail from "../routes/mail";
import routerLogin from "../routes/login";
import routerEstudiante from "../routes/estudiante";
import routerTransaccion from "../routes/transaccion";
import routerUsuario from "../routes/usuario";
import routerTemplate from "../routes/template";
import routerMatricula from "../routes/matricula";
import routerFactura from "../routes/factura";
import routerInicio from "../routes/inicio";

//====================
//   ROUTES: /api
//=====================

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hola mundo",
    developer: "Duvan Rosero",
    error: false,
    env: process.env.NODE_ENV,
    base_url: process.env.BASE_URL,
  });
});

app.use("/login", routerLogin);
app.use("/mail", routerMail);
app.use("/estudiante", routerEstudiante);
app.use("/transaccion", routerTransaccion);
app.use("/usuario", routerUsuario);
app.use("/page", routerTemplate);
app.use("/matricula", routerMatricula);
app.use("/factura", routerFactura);
app.use("/inicio", routerInicio);

export default app;
