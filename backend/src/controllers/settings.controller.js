const nodemailer = require('nodemailer');
const settingsService = require('../services/settings.service');

function getSettings(req, res) {
  const settings = settingsService.readSettings();
  res.status(200).json(settingsService.toPublicSettings(settings));
}

function resolvePassword(req) {
  const current = settingsService.readSettings();
  return req.body.password && req.body.password.trim() ? req.body.password : current.password;
}

async function verifyCandidate(candidate) {
  const { from, ...transportOptions } = settingsService.resolveSmtpConfig(candidate);
  const transporter = nodemailer.createTransport(transportOptions);
  await transporter.verify();
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
      connection: { success: false, message: err.message },
    });
  }
}

async function testConnection(req, res) {
  const candidate = { ...req.body, password: resolvePassword(req) };

  try {
    await verifyCandidate(candidate);
    res.status(200).json({ success: true, message: `Connected as ${settingsService.resolveAuthUser(candidate)}` });
  } catch (err) {
    res.status(200).json({ success: false, message: err.message });
  }
}

module.exports = { getSettings, saveSettings, testConnection };
