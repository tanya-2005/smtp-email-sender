const mailerService = require('../services/mailer.service');
const settingsService = require('../services/settings.service');

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

async function sendPersonalizedEmail(req, res, next) {
  const { recipients, subject, text, html } = req.body;
  const attachments = buildAttachments(req.files);

  try {
    const summary = await mailerService.sendPersonalizedBulkMail({ recipients, subject, text, html, attachments });
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

function getSender(req, res) {
  const settings = settingsService.readSettings();
  res.status(200).json({
    email: settings.senderEmail || null,
    configured: settingsService.isConfigured(settings),
  });
}

module.exports = { sendEmail, sendBulkEmail, sendPersonalizedEmail, getSender };
