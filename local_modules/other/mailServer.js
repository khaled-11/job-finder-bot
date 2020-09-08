/// Function to send Email Notifications to the users ///
"use strict";
const nodemailer = require('nodemailer');
require('dotenv').config();

function sendNotification(recipient_email, subject, body) {
   const eAddress = "Robin Mail";
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        secureConnection: 'tls',
        port: 587,
        requiresAuth: true,
        domains: ["gmail.com", "googlemail.com"],
        auth: {
          user:process.env.EMAIL,
          pass:process.env.E_PASS
        },
    tls: {
    rejectUnauthorized: false,
    ciphers:'SSLv3'
      },
    requireTLS : false,
    debug: false,
    logger: true
    });

    let eConfirm= {
        from: eAddress, 
        to: recipient_email,
        subject: subject,
        text: body,
    }

    transporter.sendMail(eConfirm, function(err){
        if(err){
            console.log(err);
            console.log("Failed to send email.");
            return;
        }
        else{
            console.log("Notification sent successfully!");
        }
    });
}

module.exports.sendNotification = sendNotification;
