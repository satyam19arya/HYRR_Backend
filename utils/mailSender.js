const nodemailer = require('nodemailer');

const mailSender = async (email, title, body) => {
    try{
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            }
        });

        let info = await transporter.sendMail({
            from: 'HYRR || Satyam Arya',
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });

        return info;

    } catch(e){
        console.log(e);
    }
}

module.exports = mailSender;