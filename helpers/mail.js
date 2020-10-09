var nodemailer = require('nodemailer');

let enviaMail = async function(mailOptions) {
    const gmail = {
        user: 'sigedin@itp.edu.co',
        pass: '1041179Mn*'
    };

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: gmail
    });

    // const mailOptions = {
    //     'from': `Sigedin-ITP <${gmail.user}>`,
    //     'to': dataMail.enviar_a,
    //     'subject': dataMail.asunto,
    //     // 'html': dataMail.mensaje
    //     'text': dataMail.mensaje,
    // };
    mailOptions.from = `Sigedin-ITP <${gmail.user}>`;

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function(err, info) {
            console.log("enviando email...");
            console.log(mailOptions);
            if (err) {
                resolve(false);
                console.log("Error al enviar el email");
                //console.error(err);
            } else {
                console.log(info);
                resolve(true);
            }
        });
    });


};





module.exports = {
    enviaMail
};