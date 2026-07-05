const nodemailer = require('nodemailer');
const env = require('../config/env');
const AppError = require('../utils/AppError');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }
  return transporter;
}

async function verifyConnection() {
  await getTransporter().verify();
}

async function sendMail({ to, subject, text, html, attachments }) {
  try {
    const info = await getTransporter().sendMail({
      from: env.smtp.from,
      to,
      subject,
      text,
      html,
      attachments,
    });
    return info;
  } catch (err) {
    throw new AppError(`Failed to send email: ${err.message}`, 502);
  }
}

module.exports = { sendMail, verifyConnection };
