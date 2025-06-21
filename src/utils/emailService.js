const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    // host: 'smtp.gmail.com',
    // port: 465,// explicitly set port for SSL/TLS
    // secure: true,           // true for SSL (port 465)
    auth: {
        user: 'incrediblemayo@gmail.com',
        pass: 'poxj smir hsxt zihg'
    }
    // Removed custom tls block to use default TLS settings
});


const senderEmail = "incrediblemayo@gmail.com"; // Updated sender email

const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: senderEmail,
        to,
        subject,
        html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; // Re-throw the error for further handling
    }
}

module.exports = {
    sendEmail
};