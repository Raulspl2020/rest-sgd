require("dotenv").config();
require('./config/config');
const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');



// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//File-upploads
app.use(fileUpload());

//Cors
app.use(cors());

// parse application/json
app.use(bodyParser.json());

//exponemos el contenido
app.use(express.static('public'));

//handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

console.log(path.join(__dirname, 'frontend/views'));

//RUTAS
app.use('/api', require('./routes/index'));


app.listen(process.env.PORT, () => {
    console.log(`Escuchando en el puerto ${process.env.PORT}`);
});