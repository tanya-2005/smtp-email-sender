const isValidEmail = require('../utils/isValidEmail');
const SMTP_PROVIDERS = require('../config/smtpProviders');

function validateSettings(req, res, next) {
  const { provider, senderEmail, host, port } = req.body || {};
  const errors = [];

  if (!provider || !SMTP_PROVIDERS[provider]) {
    errors.push(`"provider" must be one of: ${Object.keys(SMTP_PROVIDERS).join(', ')}`);
  }

  if (!isValidEmail(senderEmail)) {
    errors.push('"senderEmail" must be a valid email address');
  }

  if (provider === 'custom') {
    if (!host || typeof host !== 'string' || !host.trim()) {
      errors.push('"host" is required for a custom SMTP provider');
    }
    if (!port || Number.isNaN(Number(port))) {
      errors.push('"port" must be a valid number for a custom SMTP provider');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
}

module.exports = validateSettings;
