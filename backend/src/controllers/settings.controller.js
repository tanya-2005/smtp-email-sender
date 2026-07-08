const nodemailer = require('nodemailer');
const settingsService = require('../services/settings.service');
const logSmtpError = require('../utils/logSmtpError');

function getSettings(req, res) {
  const settings = settingsService.readSettings();
  res.status(200).json(settingsService.toPublicSettings(settings));
}

function resolvePassword(req) {
  const current = settingsService.readSettings();
  return req.body.password && req.body.password.trim() ? req.body.password : current.password;
}

function formatConnectionError(err) {
  return err.code ? `${err.message} (${err.code})` : err.message;
}

async function verifyCandidate(candidate) {
  const { from, ...transportOptions } = settingsService.resolveSmtpConfig(candidate);
  const target = `${transportOptions.host}:${transportOptions.port}`;
  console.log(`[SMTP] Verifying connection to ${target} (secure=${transportOptions.secure})`);

  const transporter = nodemailer.createTransport(transportOptions);

  try {
    await transporter.verify();
    console.log(`[SMTP] Verified connection to ${target}`);
  } catch (err) {
    logSmtpError(`verify ${target}`, err);
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
      connection: { success: true, message: `Connected as ${settingsService.resolveAuthUser(candidate)}` },
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
    res.status(200).json({ success: true, message: `Connected as ${settingsService.resolveAuthUser(candidate)}` });
  } catch (err) {
    res.status(200).json({ success: false, message: formatConnectionError(err) });
  }
}

module.exports = { getSettings, saveSettings, testConnection };
