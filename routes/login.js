const { Router } = require('express');
const router = Router();
var mail = require('../helpers/mail');




const { login } = require('../controllers/login');


router.post('/login', [], login);





router.post('/recuperacion', async(req, res) => {
    let body = req.body;
    let user = {};
    let data = {};
    let codeStatus = 200;
    let date = new Date();

    if (Object.entries(body).length > 2) {
        user = body;
    } else {
        user = await login_model.getUser(body.login);
        user = JSON.parse(JSON.stringify(user));
    }

    var tokenMail = await token.crearTokenAux(user);
    console.log("listo para enviar: " + process.env.BASE_URL.toString());
    var baseurl = process.env.BASE_URL.toString() + 'viewresetpass/' + tokenMail;
    console.log(baseurl);

    const mailOptions = {
        'from': `Sigedin-ITP`,
        'to': user.email,
        'subject': 'Recuperacion de contraseña Sigedin',
        // 'html': dataMail.mensaje
        'text': `Clic en este enlace para cambiar tu contraseña: ${baseurl}`,
    };
    if (await mail.enviaMail(mailOptions)) {
        res.status(200).json({
            'message': "E-mail enviado exitosamente",
            "error": false
        });
    } else {
        res.status(401).json({
            'message': "Error al enviar el email",
            "error": true
        });
    }

    data = {
        message: "Recuperar contraseña",
        token: tokenMail,
        //  baseurl: req
    };
    console.log(req.headers.host);
    codeStatus = 401;

    res.status(codeStatus).json(data);

});

router.get('/viewresetpass/:token', async(req, res) => {

    let tokenMail = req.params.token;
    var dataToken = await token.verificaToken(tokenMail);
    var data = dataToken.data;

    if (dataToken.error) {
        res.render('token_error', data);
    } else {
        data['url_sigedin'] = 'https://sigedin.itp.edu.co/';
        data['BASE_URL'] = process.env.BASE_URL.toString();
        data['token'] = tokenMail;
    }
    res.render('form_resset_pass', data);

});

router.post('/savenewpass', async(req, res) => {
    let body = req.body;
    console.log(body);

    let tokenMail = req.params.token;
    var dataToken = await token.verificaToken(body.token);

    if (dataToken.error) {
        res.status(200).json({
            error: true,
            message: 'El token ha caducado'
        });
    }

    var result = await login_model.updatePass(dataToken.data, body.pass);

    res.status(200).json({
        error: false,
        message: 'Guardado exitosamente',
        'data': result
    });


});





module.exports = router;