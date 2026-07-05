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

async function sendBulkMail({ recipients, subject, text, html, attachments }) {
  const results = [];

  for (const recipient of recipients) {
    try {
      const info = await sendMail({ to: recipient, subject, text, html, attachments });
      results.push({ email: recipient, status: 'success', messageId: info.messageId });
    } catch (err) {
      results.push({ email: recipient, status: 'failed', error: err.message });
    }
  }

  const successful = results.filter((r) => r.status === 'success').length;

  return {
    total: results.length,
    successful,
    failed: results.length - successful,
    results,
  };
}

module.exports = { sendMail, sendBulkMail, verifyConnection };
