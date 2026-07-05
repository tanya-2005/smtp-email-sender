const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

function validateSendEmail(req, res, next) {
  const { to, subject, text, html } = req.body || {};
  const errors = [];

  const recipients = Array.isArray(to) ? to : [to];
  if (!to || recipients.length === 0 || !recipients.every(isValidEmail)) {
    errors.push('"to" must be a valid email address or an array of valid email addresses');
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

  next();
}

module.exports = validateSendEmail;
