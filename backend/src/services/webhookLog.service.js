const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LOGS_FILE = path.join(DATA_DIR, 'webhookLogs.json');
const MAX_LOGS = 200;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readLogs() {
  ensureDataDir();
  if (!fs.existsSync(LOGS_FILE)) return [];

  try {
    const raw = fs.readFileSync(LOGS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  ensureDataDir();
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

function addLog(entry) {
  const logs = readLogs();
  const record = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  logs.unshift(record);
  writeLogs(logs.slice(0, MAX_LOGS));
  return record;
}

function getLogs() {
  return readLogs();
}

module.exports = { addLog, getLogs };
