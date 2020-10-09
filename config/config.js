//=========================
//   VENCIMIENTO DEL TOKEN
//=========================
process.env.CADUCIDAD_TOKEN = 60 * 60 * 60 * 60;


//=========================
//   SECRET_KEY
//=========================
process.env.SECRET_KEY = 'EA8KnX1qGNsqZz3ExyNEVfD6Mf1KktlpW3SkhXdyW8';



//=========================
//   ENTORNO
//=========================
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';


//=========================
//   PUERTO SERVER
//=========================

process.env.PORT = process.env.PORT || 3000;

//=========================
//   base_url
//=========================

process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/';