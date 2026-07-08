module.exports = {
  MAX_RECIPIENTS: 150,
  MAX_WEBHOOK_ATTACHMENTS: 10,
  MAX_WEBHOOK_ATTACHMENT_SIZE_BYTES: 10 * 1024 * 1024,
  // Must comfortably fit MAX_WEBHOOK_ATTACHMENTS base64-encoded attachments
  // (base64 inflates payload size by ~1.37x), plus JSON overhead.
  JSON_BODY_LIMIT: '25mb',

  // Nodemailer's own defaults (2 min connection, no greeting/socket timeout)
  // mean a blocked or unreachable SMTP host hangs for minutes with no
  // feedback. These bound every SMTP attempt (verify and send) to fail fast.
  SMTP_CONNECTION_TIMEOUT_MS: 10000,
  SMTP_GREETING_TIMEOUT_MS: 10000,
  SMTP_SOCKET_TIMEOUT_MS: 15000,
};
