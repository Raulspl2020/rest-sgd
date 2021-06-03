import Knex from 'knex';

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
    database:  process.env.MYSQL_DEV_AUTH_DATABASE,
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

if (process.env.NODE_ENV == "dev") {
  db.default = db.desarrollo;
  auth.default = auth.desarrollo;
} else {
  console.log("El entorno es: " + process.env.NODE_ENV);

  db.default = db.produccion;
  auth.default = auth.produccion;
}

let conDB: any = Knex({
  client: "mysql",
  connection: db.default,
});
let conAuth = Knex({
  client: "mysql",
  connection: auth.default,
});

export { conDB, conAuth };
