const express = require('express');
const { response } = require('express');
const app = express();


//====================
//   ROUTES: /api
//=====================


app.get('/', (req, res=response) => {

    res.json({
        'message': 'Hola mundo',
        'developer': 'Duvan Rosero',
        'error': false,
        'env': process.env.NODE_ENV,
        'base_url': process.env.BASE_URL
    });
});


app.use('/login',require('./login'));
app.use('/mail',require('./mail'));

app.use(require('./usuario'));
app.use(require('./inicio'));
app.use(require('./estudiante'));

module.exports = app;
