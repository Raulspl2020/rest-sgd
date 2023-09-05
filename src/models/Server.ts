import express, { Application } from "express";
import Routes from "../routes";

import {
  verificaPagosPendientes,
  verificaPagosPendientesOnline,
  verificaPagosPendienteSysApolo,
} from "../helpers/cron_job";

import cors from "cors";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import path from "path";
import cron from "node-cron";
import { conMongo } from "../config/database";

class Server {
  private app: Application;
  private port: String;

  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.dbConnection();
    this.middlewares();
    this.routes();
    this.config();
    this.cronJob();
  }

  async cronJob() {
    if (process.env.NODE_ENV === "pro") {
      cron.schedule("*/15 * * * *", () => verificaPagosPendientesOnline());

      cron.schedule("*/10 * * * *", () => verificaPagosPendienteSysApolo());
    }
  }

  middlewares() {
    //Cors
    this.app.use(cors());

    // parse application/x-www-form-urlencoded
    this.app.use(bodyParser.urlencoded({ extended: false }));
    //body-parser-json
    this.app.use(bodyParser.json());
    //File-upploads
    this.app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
        createParentPath: true,
      })
    );
    //carpeta publica
    this.app.use("/api/static", express.static("public"));
  }

  async dbConnection() {
    // await conMongo();
    // try {
    //     console.log('Connection has been established successfully.');
    // } catch (error) {
    //     console.error('Unable to connect to the database:', error);
    // }
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Escuchando en el puerto ${this.port}`);
    });
  }
  //RUTAS
  routes() {
    this.app.use("/api", Routes);
  }

  config() {
    //handlebars
    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "hbs");
  }
}

export default Server;
