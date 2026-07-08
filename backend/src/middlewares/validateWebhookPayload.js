const isValidEmail = require('../utils/isValidEmail');
const webhookLogService = require('../services/webhookLog.service');
const { MAX_WEBHOOK_ATTACHMENTS: MAX_ATTACHMENTS, MAX_WEBHOOK_ATTACHMENT_SIZE_BYTES: MAX_ATTACHMENT_SIZE_BYTES } = require('../config/limits');

function estimateBase64Size(base64) {
  return Math.ceil((base64.length * 3) / 4);
}

function validateAttachments(attachments, errors) {
  if (attachments === undefined) return;

  if (!Array.isArray(attachments)) {
    errors.push('"attachments" must be an array');
    return;
  }

  if (attachments.length > MAX_ATTACHMENTS) {
    errors.push(`A maximum of ${MAX_ATTACHMENTS} attachments is allowed`);
    return;
  }

  attachments.forEach((attachment, index) => {
    if (!attachment || typeof attachment !== 'object') {
      errors.push(`attachments[${index}] must be an object`);
      return;
    }

    if (!attachment.filename || typeof attachment.filename !== 'string') {
      errors.push(`attachments[${index}].filename is required`);
    }

    if (!attachment.content || typeof attachment.content !== 'string') {
      errors.push(`attachments[${index}].content is required and must be base64-encoded`);
    } else if (estimateBase64Size(attachment.content) > MAX_ATTACHMENT_SIZE_BYTES) {
      errors.push(`attachments[${index}] exceeds the 10 MB size limit`);
    }
  });
}

function validateWebhookPayload(req, res, next) {
  const { recipientEmail, recipientName, subject, body, html, attachments } = req.body || {};
  const errors = [];

  if (!isValidEmail(recipientEmail)) {
    errors.push('"recipientEmail" is required and must be a valid email address');
  }

  if (recipientName !== undefined && typeof recipientName !== 'string') {
    errors.push('"recipientName" must be a string');
  }

  if (subject !== undefined && (typeof subject !== 'string' || !subject.trim())) {
    errors.push('"subject" must be a non-empty string when provided');
  }

  if (!body && !html) {
    errors.push('Either "body" or "html" content is required');
  }

  validateAttachments(attachments, errors);

  if (errors.length > 0) {
    webhookLogService.addLog({
      status: 'failed',
      recipientEmail: recipientEmail || null,
      recipientName: recipientName || null,
      subject: subject || null,
      messageId: null,
      error: errors.join(' '),
      payload: req.body,
    });

    return res.status(400).json({ errors });
  }

  next();
}

module.exports = validateWebhookPayload;
