const isValidEmail = require('../utils/isValidEmail');
const { MAX_RECIPIENTS } = require('../config/limits');

function validateBulkSendEmail(req, res, next) {
  const { recipients, subject, text, html } = req.body || {};
  const errors = [];

  const list = Array.isArray(recipients) ? recipients : recipients ? [recipients] : [];

  if (list.length === 0 || !list.every(isValidEmail)) {
    errors.push('"recipients" must be a non-empty array of valid email addresses');
  } else if (list.length > MAX_RECIPIENTS) {
    errors.push(`A maximum of ${MAX_RECIPIENTS} recipients is allowed per bulk send`);
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    errors.push('"subject" is required and must be a non-empty string');
  }

  if (!text && !html) {
    errors.push('Either "text" or "html" body content is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  req.body.recipients = list;
  next();
}

module.exports = validateBulkSendEmail;
