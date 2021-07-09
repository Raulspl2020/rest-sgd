//=========================
//   ENTORNO
//=========================
process.env.NODE_ENV = process.env.NODE_ENV || 'local';

//=========================
//   PUERTO SERVER
//=========================

process.env.PORT = process.env.PORT || '3000';

//=========================
//   base_url
//=========================
if(process.env.NODE_ENV==='local'){
    process.env.BASE_URL = `http://localhost:${process.env.PORT}/api`;
}

if(process.env.NODE_ENV==='dev'){
    process.env.BASE_URL = `https://desarrollo.itp.edu.co/api`;
}