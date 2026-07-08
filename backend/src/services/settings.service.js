const fs = require('fs');
const path = require('path');

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
  username: '',
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

// "password" holds the Resend API key and "senderEmail" is the from address -
// provider/host/port/secure/username are still stored (the UI still shows
// them) but no longer affect how mail is actually sent.
function isConfigured(settings) {
  return Boolean(settings.senderEmail && settings.password);
}

function toPublicSettings(settings) {
  const { password, ...rest } = settings;
  return { ...rest, hasPassword: Boolean(password), configured: isConfigured(settings) };
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
    username: input.provider === 'custom' ? input.username || '' : '',
  };

  writeSettings(next);
  return next;
}

module.exports = {
  readSettings,
  saveSettings,
  isConfigured,
  toPublicSettings,
};
