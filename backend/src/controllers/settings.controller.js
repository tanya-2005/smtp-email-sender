const settingsService = require('../services/settings.service');
const resendService = require('../services/resend.service');
const logMailError = require('../utils/logMailError');

function getSettings(req, res) {
  const settings = settingsService.readSettings();
  res.status(200).json(settingsService.toPublicSettings(settings));
}

function resolvePassword(req) {
  const current = settingsService.readSettings();
  return req.body.password && req.body.password.trim() ? req.body.password : current.password;
}

function formatConnectionError(err) {
  return err.status ? `${err.message} (${err.status})` : err.message;
}

async function verifyCandidate(candidate) {
  console.log(`[Resend] Verifying API key for ${candidate.senderEmail}`);

  try {
    await resendService.verifyApiKey(candidate.password);
    console.log(`[Resend] API key verified for ${candidate.senderEmail}`);
  } catch (err) {
    logMailError(`verify Resend API key for ${candidate.senderEmail}`, err);
    throw err;
  }
}

async function saveSettings(req, res) {
  const saved = settingsService.saveSettings(req.body);
  const candidate = { ...saved, password: resolvePassword(req) };

  try {
    await verifyCandidate(candidate);
    res.status(200).json({
      ...settingsService.toPublicSettings(saved),
      connection: { success: true, message: `Connected to Resend as ${candidate.senderEmail}` },
    });
  } catch (err) {
    res.status(200).json({
      ...settingsService.toPublicSettings(saved),
      connection: { success: false, message: formatConnectionError(err) },
    });
  }
}

async function testConnection(req, res) {
  const candidate = { ...req.body, password: resolvePassword(req) };

  try {
    await verifyCandidate(candidate);
    res.status(200).json({ success: true, message: `Connected to Resend as ${candidate.senderEmail}` });
  } catch (err) {
    res.status(200).json({ success: false, message: formatConnectionError(err) });
  }
}

module.exports = { getSettings, saveSettings, testConnection };
