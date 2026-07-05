const mailerService = require('../services/mailer.service');

function buildAttachments(files) {
  return (files || []).map((file) => ({
    filename: file.originalname,
    content: file.buffer,
    contentType: file.mimetype,
  }));
}

async function sendEmail(req, res, next) {
  const { to, subject, text, html } = req.body;
  const attachments = buildAttachments(req.files);

  try {
    const info = await mailerService.sendMail({ to, subject, text, html, attachments });
    res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (err) {
    next(err);
  }
}

async function sendBulkEmail(req, res, next) {
  const { recipients, subject, text, html } = req.body;
  const attachments = buildAttachments(req.files);

  try {
    const summary = await mailerService.sendBulkMail({ recipients, subject, text, html, attachments });
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

module.exports = { sendEmail, sendBulkEmail };
