const mailerService = require('../services/mailer.service');

async function sendEmail(req, res, next) {
  const { to, subject, text, html } = req.body;

  try {
    const info = await mailerService.sendMail({ to, subject, text, html });
    res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendEmail };
