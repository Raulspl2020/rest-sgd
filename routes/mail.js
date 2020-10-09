var nodemailer = require('nodemailer');
const { Router } =  require('express');
const router = Router();
var md5 = require('md5');

router.post('/mail', async(req, res) => {
    let body = req.body;

    //validamos objeto vacio
    if (Object.entries(body).length < 3) {
        res.status(401).json({
            'message': "No se registan parametros completos - x-www-form-urlencoded",
            "error": true
        });
        return;
    }

    console.log("Recibiendo datos...");
    console.log(body);
    var dataMail = {
        'from_name': body.from_name,
        'enviar_a': body.enviar_a,
        'asunto': body.asunto,
        'mensaje': body.mensaje,
        'key': body.key
    }


    const gmail = {
        user: 'sigedin@itp.edu.co',
        pass: '1041179Mn*'
    };

    if (md5('Duvan07*') != dataMail.key) {
        res.status(401).json({
            'message': "Usuario no autorizado",
            "error": true
        });
        return;
    }

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: gmail
    });


    const mailOptions = {
        'from': `Sigedin-ITP <${gmail.user}>`,
        'to': dataMail.enviar_a,
        'subject': dataMail.asunto,
        // 'html': dataMail.mensaje
        'text': dataMail.mensaje,
    };

    transporter.sendMail(mailOptions, function(err, info) {
        console.log("enviando email...");
        console.log(mailOptions);
        if (err) {
            console.error(err);
            res.status(401).json({
                'message': err,
                "error": true
            });
        } else {
            console.log(info);
            res.status(200).json({
                'message': "E-mail enviado exitosamente",
                "error": false
            });
        }
    });

});

module.exports = router;