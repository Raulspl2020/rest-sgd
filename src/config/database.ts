import Knex from 'knex';

const db: any = {
  desarrollo: {
    host: "10.10.13.13",
    user: "dvn",
    password: "duvan07+",
    database: "sigedin_ies",
    port: 3306,
  },

  produccion: {
    host: process.env.MYSQL_DB_HOST,
    user: process.env.MYSQL_DB_USER,
    password: process.env.MYSQL_DB_PASS,
    database: process.env.MYSQL_DB_DATABASE,
    port: 3306,
  },
};

const auth: any = {
  desarrollo: {
    host: "10.10.13.13",
    user: "dvn",
    password: "duvan07+",
    database: "sigedin_seguridad",
    port: 3306,
  },

  produccion: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
    port: 3306,
  },
};

if (process.env.NODE_ENV == "dev") {
  db.default = db.desarrollo;
  auth.default = auth.desarrollo;
} else {
  console.log(db);
  console.log("El entorno es: " + process.env.NODE_ENV);
  console.log(process.env.NODE_ENV);

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
