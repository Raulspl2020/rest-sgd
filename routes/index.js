const express = require('express');
const app = express();


//====================
//   ROUTES: 
//=====================


app.get('/', (req, res) => {
    //   res.send(`Servidor escuchando en el puerto ${process.env.PORT }`);
    res.json({
        'message': 'Hola mundo',
        'developer': 'Duvan Rosero',
        'error': false,
        'env': process.env.NODE_ENV,
        'base_url': process.env.BASE_URL
    });
});


app.use('/login',require('./login'));

app.use(require('./usuario'));
app.use(require('./inicio'));
app.use(require('./estudiante'));
app.use(require('./mail'));

module.exports = app;
