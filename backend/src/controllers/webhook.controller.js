const mailerService = require('../services/mailer.service');
const webhookLogService = require('../services/webhookLog.service');
const personalize = require('../utils/personalize');

function buildAttachments(attachments) {
  return (attachments || []).map((attachment) => ({
    filename: attachment.filename,
    content: attachment.content,
    encoding: 'base64',
    contentType: attachment.contentType,
  }));
}

async function receiveWebhook(req, res, next) {
  const { recipientEmail, recipientName, subject, body, html, attachments } = req.body;
  const personalizeData = { email: recipientEmail, name: recipientName || '' };

  try {
    const info = await mailerService.sendMail({
      to: recipientEmail,
      subject: personalize(subject, personalizeData),
      text: personalize(body, personalizeData),
      html: personalize(html, personalizeData),
      attachments: buildAttachments(attachments),
    });

    webhookLogService.addLog({
      status: 'success',
      recipientEmail,
      recipientName: recipientName || null,
      subject,
      messageId: info.messageId,
      error: null,
      payload: req.body,
    });

    res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (err) {
    webhookLogService.addLog({
      status: 'failed',
      recipientEmail,
      recipientName: recipientName || null,
      subject,
      messageId: null,
      error: err.message,
      payload: req.body,
    });

    next(err);
  }
}

function getWebhookLogs(req, res) {
  res.status(200).json(webhookLogService.getLogs());
}

module.exports = { receiveWebhook, getWebhookLogs };
