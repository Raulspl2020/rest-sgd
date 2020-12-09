var nodemailer = require('nodemailer');

let enviaMail = async function(dataMail, mailAuth) {

    return new Promise((resolve, reject) => {
        const gmail = mailAuth;

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: gmail
        });

        let mailOptions = dataMail;
        //mailOptions.from = `Sigedin-ITP <${gmail.user}>`;
        transporter.sendMail(mailOptions, function(err, info) {
            console.log("enviando email...");
            console.log(mailOptions);
            if (err) {
                console.log(err);
                reject(err);
                console.log("Error al enviar el email");
                //console.error(err);
            } else {
                //    console.log(info);
                resolve(true);
            }
        });
    });


};





module.exports = {
    enviaMail
};