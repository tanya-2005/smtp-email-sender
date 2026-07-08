const AppError = require('../utils/AppError');
const isValidEmail = require('../utils/isValidEmail');
const personalize = require('../utils/personalize');
const logMailError = require('../utils/logMailError');
const resendService = require('./resend.service');
const settingsService = require('./settings.service');

function assertConfigured() {
  const settings = settingsService.readSettings();
  if (!settingsService.isConfigured(settings)) {
    throw new AppError('Sender Account is not configured. Please set up your Sender Account first.', 503);
  }
  return settings;
}

function buildFrom(settings) {
  return settings.senderName ? `"${settings.senderName}" <${settings.senderEmail}>` : settings.senderEmail;
}

async function verifyConnection() {
  const settings = assertConfigured();

  try {
    await resendService.verifyApiKey(settings.password);
  } catch (err) {
    logMailError('startup verifyConnection', err);
    throw err;
  }
}

async function sendMail({ to, subject, text, html, attachments }) {
  const settings = assertConfigured();

  try {
    const info = await resendService.sendEmail({
      apiKey: settings.password,
      from: buildFrom(settings),
      to,
      subject,
      text,
      html,
      attachments,
    });
    return info;
  } catch (err) {
    logMailError(`sendMail to ${to}`, err);
    throw new AppError(`Failed to send email: ${err.message}`, 502);
  }
}

async function sendBulkMail({ recipients, subject, text, html, attachments }) {
  assertConfigured();
  const results = [];

  for (const recipient of recipients) {
    try {
      const info = await sendMail({ to: recipient, subject, text, html, attachments });
      results.push({ email: recipient, status: 'success', messageId: info.messageId });
    } catch (err) {
      results.push({ email: recipient, status: 'failed', error: err.message });
    }
  }

  const successful = results.filter((r) => r.status === 'success').length;

  return {
    total: results.length,
    successful,
    failed: results.length - successful,
    results,
  };
}

async function sendPersonalizedBulkMail({ recipients, subject, text, html, attachments }) {
  assertConfigured();
  const results = [];

  for (const recipient of recipients) {
    const email = recipient?.email;

    if (!isValidEmail(email)) {
      results.push({
        email: email || '(missing email)',
        status: 'failed',
        error: 'Invalid or missing email address - skipped',
      });
      continue;
    }

    try {
      const info = await sendMail({
        to: email,
        subject: personalize(subject, recipient),
        text: personalize(text, recipient),
        html: personalize(html, recipient),
        attachments,
      });
      results.push({ email, status: 'success', messageId: info.messageId });
    } catch (err) {
      results.push({ email, status: 'failed', error: err.message });
    }
  }

  const successful = results.filter((r) => r.status === 'success').length;

  return {
    total: results.length,
    successful,
    failed: results.length - successful,
    results,
  };
}

module.exports = { sendMail, sendBulkMail, sendPersonalizedBulkMail, verifyConnection };
