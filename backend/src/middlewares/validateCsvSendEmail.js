const { MAX_RECIPIENTS } = require('../config/limits');

function validateCsvSendEmail(req, res, next) {
  const { recipients, subject, text, html } = req.body || {};
  const errors = [];

  let parsedRecipients;
  try {
    parsedRecipients = typeof recipients === 'string' ? JSON.parse(recipients) : recipients;
  } catch {
    return res.status(400).json({ errors: ['"recipients" must be valid JSON'] });
  }

  if (!Array.isArray(parsedRecipients) || parsedRecipients.length === 0) {
    errors.push('"recipients" must be a non-empty array');
  } else if (parsedRecipients.length > MAX_RECIPIENTS) {
    errors.push(`A maximum of ${MAX_RECIPIENTS} recipients is allowed per send`);
  } else if (!parsedRecipients.some((r) => r && typeof r.email === 'string' && r.email.trim())) {
    errors.push('At least one recipient with an "email" value is required');
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

  req.body.recipients = parsedRecipients;
  next();
}

module.exports = validateCsvSendEmail;
