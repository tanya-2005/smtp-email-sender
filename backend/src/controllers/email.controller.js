const mailerService = require('../services/mailer.service');

async function sendEmail(req, res, next) {
  const { to, subject, text, html } = req.body;
  const attachments = (req.files || []).map((file) => ({
    filename: file.originalname,
    content: file.buffer,
    contentType: file.mimetype,
  }));

  try {
    const info = await mailerService.sendMail({ to, subject, text, html, attachments });
    res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendEmail };
