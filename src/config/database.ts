import Knex from 'knex';
import { connect } from "mssql";
import mongoose from 'mongoose';
const db: any = {
  desarrollo: {
    host: process.env.MYSQL_DEV_SGD_HOST,
    user: process.env.MYSQL_DEV_SGD_USER,
    password: process.env.MYSQL_DEV_SGD_PASS,
    database: process.env.MYSQL_DEV_SGD_DATABASE,
    port: 3306,
  },

  produccion: {
    host: process.env.MYSQL_PROD_SGD_HOST,
    user: process.env.MYSQL_PROD_SGD_USER,
    password: process.env.MYSQL_PROD_SGD_PASS,
    database: process.env.MYSQL_PROD_SGD_DATABASE,
    port: 3306,
  },
};

const auth: any = {
  desarrollo: {
    host: process.env.MYSQL_DEV_AUTH_HOST,
    user: process.env.MYSQL_DEV_AUTH_USER,
    password: process.env.MYSQL_DEV_AUTH_PASS,
    database: process.env.MYSQL_DEV_AUTH_DATABASE,
    port: 3306,
  },

  produccion: {
    host: process.env.MYSQL_PROD_AUTH_HOST,
    user: process.env.MYSQL_PROD_AUTH_USER,
    password: process.env.MYSQL_PROD_AUTH_PASS,
    database: process.env.MYSQL_PROD_AUTH_DATABASE,
    port: 3306,
  },
};

if (process.env.NODE_ENV == "pro") {
  db.default = db.produccion;
  auth.default = auth.produccion;
} else {
  db.default = db.desarrollo;
  auth.default = auth.desarrollo;
}


let conDB: any = Knex({
  client: "mysql",
  connection: db.default,
});
let conAuth = Knex({
  client: "mysql",
  connection: auth.default,
});

const sqlConfig = {
  user: process.env.MSSQL_DEV_USER,
  password: process.env.MSSQL_DEV_PASS,
  server: process.env.MSSQL_DEV_SERVER.toString(),
  database: process.env.MSSQL_DEV_DATABASE,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
}


//establece una coneccion con sqlserver
const conSysApolo = async () => {
  try {
    let conexion = await connect(sqlConfig)
    return conexion;
  } catch (err) {
    console.log(err);
    return null;
  }
}

const mongo_cnn_url = ():string => {
  return `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_DB_PORT}/${process.env.MONGO_DB_NAME}`
}

//conectar a base de datos mongo
const conMongo = async () => {

  try {
    console.log("starting connection",mongo_cnn_url())
    await mongoose.connect(mongo_cnn_url());
    console.log("base de datos MONGO online");
  } catch (error) {
    throw new Error("Error de conexion: " + error);

  }

}

export { conDB, conAuth, conSysApolo, conMongo };
