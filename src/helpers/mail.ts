import nodemailer from "nodemailer";

let enviaMail = async function (dataMail: any, mailAuth: any) {
  return new Promise((resolve, reject) => {
    const gmail = mailAuth;

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: gmail,
    });

    let mailOptions = dataMail;
    //mailOptions.from = `Sigedin-ITP <${gmail.user}>`;
    transporter.sendMail(mailOptions, function (err, info) {
      console.log("enviando email...");
      console.log(mailOptions);
      if (err) {
        console.log(err);
        reject(false);
        console.log("Error al enviar el email");
      } else {
        console.log(info);
        resolve(true);
      }
    });
  });
};

export { enviaMail };
