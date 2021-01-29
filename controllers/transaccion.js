const { response } = require('express');

//====================
//   /transaccion/estado 
//=====================
const actualizarTransaccion = async(req, res = response) => {
    let body = req.body;

    res.status(200).json({
        'message': "funciona",
        "error": false
    });




};




module.exports = {
    actualizarTransaccion
}