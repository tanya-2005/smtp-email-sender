const fs = require('fs');
const net = require('net');
const dns = require('dns').promises;
const path = require('path');
const SMTP_PROVIDERS = require('../config/smtpProviders');
const {
  SMTP_CONNECTION_TIMEOUT_MS,
  SMTP_GREETING_TIMEOUT_MS,
  SMTP_SOCKET_TIMEOUT_MS,
} = require('../config/limits');

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

function isConfigured(settings) {
  if (!settings.provider || !settings.senderEmail || !settings.password) return false;
  if (settings.provider === 'custom') return Boolean(settings.host && settings.port);
  return true;
}

function toPublicSettings(settings) {
  const { password, ...rest } = settings;
  return { ...rest, hasPassword: Boolean(password), configured: isConfigured(settings) };
}

function resolveAuthUser(settings) {
  if (settings.provider === 'custom' && settings.username && settings.username.trim()) {
    return settings.username.trim();
  }
  return settings.senderEmail;
}

// Nodemailer resolves both A and AAAA records itself and picks *randomly*
// between them (see nodemailer/lib/shared/index.js formatDNSValue), so on
// hosts without real IPv6 egress (e.g. Railway) a send can intermittently
// fail with ENETUNREACH when it happens to pick an IPv6 address. Nodemailer
// has no option to force a family, but it skips its own DNS resolution
// entirely when `host` is already an IP literal - so we resolve to IPv4
// ourselves and pass that IP straight through, forcing every connection
// attempt onto IPv4 deterministically.
async function resolveIPv4Host(host) {
  if (!host || net.isIP(host)) return host;

  try {
    const { address } = await dns.lookup(host, { family: 4 });
    return address;
  } catch {
    // No IPv4 address available (or resolution failed) - fall back to the
    // original hostname rather than breaking the connection attempt.
    return host;
  }
}

async function resolveSmtpConfig(settings) {
  const preset = SMTP_PROVIDERS[settings.provider];
  if (!preset) throw new Error('Unknown SMTP provider');

  const { host, port, secure } =
    settings.provider === 'custom'
      ? { host: settings.host, port: Number(settings.port), secure: Boolean(settings.secure) }
      : preset;

  const ipv4Host = await resolveIPv4Host(host);

  return {
    host: ipv4Host,
    port,
    secure,
    // Preserve the real hostname for TLS SNI and certificate validation,
    // since we're now connecting via a resolved IP literal instead of it.
    servername: host,
    auth: { user: resolveAuthUser(settings), pass: settings.password },
    from: settings.senderName ? `"${settings.senderName}" <${settings.senderEmail}>` : settings.senderEmail,
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
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
  resolveSmtpConfig,
  resolveAuthUser,
};
