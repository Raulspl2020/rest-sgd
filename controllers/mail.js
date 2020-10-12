const { enviaMail } = require('../helpers/mail');

const enviaEMail = async(req, res) => {
    let body = req.body;
    //validamos objeto vacio
    if (Object.entries(body).length < 3) {
        res.status(401).json({
            'message': "No se registan parametros completos - x-www-form-urlencoded",
            "error": true
        });
        return;
    }

    const mailAuth = {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    };
    console.log(mailAuth);

    var dataMail = {
        'from_name': body.from_name,
        'enviar_a': body.enviar_a,
        'asunto': body.asunto,
        'mensaje': body.mensaje,
        'key': body.key
    }

    if (process.env.EMAIL_KEY != dataMail.key) {
        res.status(401).json({
            'message': "Usuario no autorizado",
            "error": true
        });
        return;
    }

    try {
        let response = await enviaMail(dataMail, mailAuth);
        console.log("imprimendo respuiesta");
        console.log(response);
        if (!response) {
            res.status(401).json({
                'message': response,
                "error": true
            });
        } else {
            res.status(200).json({
                'message': "E-mail enviado exitosamente",
                "error": false
            });
        }

    } catch (error) {
        res.status(500).json({
            'message': "Error al enviar el email",
            'data': error,
            "error": true
        });
    }


};

module.exports = {
    enviaEMail
}