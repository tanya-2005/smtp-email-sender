const isValidEmail = require('../utils/isValidEmail');

function validateSettings(req, res, next) {
  const { provider, senderEmail } = req.body || {};
  const errors = [];

  if (!provider || typeof provider !== 'string') {
    errors.push('"provider" is required');
  }

  if (!isValidEmail(senderEmail)) {
    errors.push('"senderEmail" must be a valid email address');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
}

module.exports = validateSettings;
