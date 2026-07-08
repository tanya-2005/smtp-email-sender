module.exports = {
  MAX_RECIPIENTS: 150,
  MAX_WEBHOOK_ATTACHMENTS: 10,
  MAX_WEBHOOK_ATTACHMENT_SIZE_BYTES: 10 * 1024 * 1024,
  // Must comfortably fit MAX_WEBHOOK_ATTACHMENTS base64-encoded attachments
  // (base64 inflates payload size by ~1.37x), plus JSON overhead.
  JSON_BODY_LIMIT: '25mb',
};
