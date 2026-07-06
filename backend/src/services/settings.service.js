const fs = require('fs');
const path = require('path');
const SMTP_PROVIDERS = require('../config/smtpProviders');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  provider: '',
  senderName: '',
  senderEmail: '',
  password: '',
  host: '',
  port: '',
  secure: false,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readSettings() {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULT_SETTINGS };

  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(settings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

function isConfigured(settings) {
  if (!settings.provider || !settings.senderEmail || !settings.password) return false;
  if (settings.provider === 'custom') return Boolean(settings.host && settings.port);
  return true;
}

function toPublicSettings(settings) {
  const { password, ...rest } = settings;
  return { ...rest, hasPassword: Boolean(password), configured: isConfigured(settings) };
}

function resolveSmtpConfig(settings) {
  const preset = SMTP_PROVIDERS[settings.provider];
  if (!preset) throw new Error('Unknown SMTP provider');

  const { host, port, secure } =
    settings.provider === 'custom'
      ? { host: settings.host, port: Number(settings.port), secure: Boolean(settings.secure) }
      : preset;

  return {
    host,
    port,
    secure,
    auth: { user: settings.senderEmail, pass: settings.password },
    from: settings.senderName ? `"${settings.senderName}" <${settings.senderEmail}>` : settings.senderEmail,
  };
}

function saveSettings(input) {
  const current = readSettings();
  const password = input.password && input.password.trim() ? input.password : current.password;

  const next = {
    provider: input.provider,
    senderName: input.senderName || '',
    senderEmail: input.senderEmail,
    password,
    host: input.provider === 'custom' ? input.host || '' : '',
    port: input.provider === 'custom' ? input.port || '' : '',
    secure: input.provider === 'custom' ? Boolean(input.secure) : false,
  };

  writeSettings(next);
  return next;
}

module.exports = {
  readSettings,
  saveSettings,
  isConfigured,
  toPublicSettings,
  resolveSmtpConfig,
};
