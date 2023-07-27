//=========================
//   ENTORNO
//=========================
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

//=========================
//   PUERTO SERVER
//=========================

process.env.PORT = process.env.PORT || '3000';

//=========================
//   base_url
//=========================
process.env.BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT}/api`;