// Temporary diagnostic route used to determine why SMTP connections were
// timing out on the deployed host. Tests fixed, hardcoded targets only (no
// user-supplied host/port) to avoid becoming an SSRF vector. Safe to remove
// once the investigation is complete.
const express = require('express');
const net = require('net');
const dns = require('dns').promises;

const router = express.Router();

const TCP_TARGETS = [
  { host: 'smtp.gmail.com', port: 465, label: 'gmail-465-implicit-tls' },
  { host: 'smtp.gmail.com', port: 587, label: 'gmail-587-starttls' },
  { host: 'smtp.gmail.com', port: 25, label: 'gmail-25-plain' },
  { host: 'www.google.com', port: 443, label: 'control-https-443' },
];

function probeTcp(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    let settled = false;
    const socket = net.createConnection({ host, port, family: 4 });

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ host, port, ms: Date.now() - start, ...result });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish({ success: true }));
    socket.once('timeout', () => finish({ success: false, error: 'timeout' }));
    socket.once('error', (err) => finish({ success: false, error: err.code || err.message }));
  });
}

router.get('/network', async (req, res) => {
  const dnsResults = {};

  try {
    dnsResults.ipv4 = await dns.lookup('smtp.gmail.com', { family: 4 });
  } catch (err) {
    dnsResults.ipv4 = { error: err.code || err.message };
  }

  try {
    dnsResults.ipv6 = await dns.lookup('smtp.gmail.com', { family: 6 });
  } catch (err) {
    dnsResults.ipv6 = { error: err.code || err.message };
  }

  const tcpResults = await Promise.all(
    TCP_TARGETS.map(({ host, port, label }) => probeTcp(host, port).then((result) => ({ label, ...result }))),
  );

  res.status(200).json({ dns: dnsResults, tcp: tcpResults });
});

module.exports = router;
