const nodemailer = require('nodemailer');
const config = require("../../config/environments");
/** configuration of the transporter */
var transporter = nodemailer.createTransport(
    {
        host: config.SMTPSetup.SES_HOST,
        port: config.SMTPSetup.SES_PORT,
        // secure: true,
        auth:
        {
            user: config.SMTPSetup.SMTP_USERNAME,
            pass: config.SMTPSetup.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });
const sendEmail = async (data) => {
    return new Promise((resolve, reject) => {
        mailOptions = {
            from: `"Support" ${config.SMTPSetup.FROM}`,
            to: data.recipientsAddress,
            subject: data.subject,
            html: data.body
        }
        //sendMail functionality
        transporter.sendMail(mailOptions, function (err, data) {
            if (err) {
                console.log("In Send mail:..." + err);
                return false;
            }
            else {
                console.log("Mail sent successfully!!!!");
                return true;
            }
        });
        return resolve(true);
    });
};
module.exports = {
    sendEmail
};
