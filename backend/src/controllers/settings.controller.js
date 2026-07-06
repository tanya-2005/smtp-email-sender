const nodemailer = require('nodemailer');
const settingsService = require('../services/settings.service');

function getSettings(req, res) {
  const settings = settingsService.readSettings();
  res.status(200).json(settingsService.toPublicSettings(settings));
}

function saveSettings(req, res) {
  const saved = settingsService.saveSettings(req.body);
  res.status(200).json(settingsService.toPublicSettings(saved));
}

async function testConnection(req, res) {
  const current = settingsService.readSettings();
  const password = req.body.password && req.body.password.trim() ? req.body.password : current.password;
  const candidate = { ...req.body, password };

  try {
    const { from, ...transportOptions } = settingsService.resolveSmtpConfig(candidate);
    const transporter = nodemailer.createTransport(transportOptions);
    await transporter.verify();
    res.status(200).json({ success: true, message: 'Connection successful.' });
  } catch (err) {
    res.status(200).json({ success: false, message: err.message });
  }
}

module.exports = { getSettings, saveSettings, testConnection };
