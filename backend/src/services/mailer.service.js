const AppError = require('../utils/AppError');
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
    const wrapped = new AppError(`Failed to send email: ${err.message}`, 502);
    // Preserved for the campaign scheduler's retry classifier - not read by any other
    // caller, so this doesn't change behavior for the existing single/bulk send paths.
    wrapped.providerStatus = err.status;
    wrapped.isNetworkError = err.isNetworkError === true;
    throw wrapped;
  }
}

module.exports = { sendMail, verifyConnection, assertConfigured };
