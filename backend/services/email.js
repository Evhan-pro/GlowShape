require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: process.env.SENDGRID_API_KEY ? {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  } : undefined
});

async function sendEmail(to, subject, html) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('⚠ SendGrid not configured - email not sent');
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

module.exports = { sendEmail };
