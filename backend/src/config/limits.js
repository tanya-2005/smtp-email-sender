module.exports = {
  MAX_RECIPIENTS: 150,
  MAX_WEBHOOK_ATTACHMENTS: 10,
  MAX_WEBHOOK_ATTACHMENT_SIZE_BYTES: 10 * 1024 * 1024,
  // Must comfortably fit MAX_WEBHOOK_ATTACHMENTS base64-encoded attachments
  // (base64 inflates payload size by ~1.37x), plus JSON overhead.
  JSON_BODY_LIMIT: '25mb',
  // Drip campaign settings: recipients per batch, and the delay before the next batch fires.
  BATCH_SIZE: 50,
  BATCH_INTERVAL_MINUTES: 10,
  // How often the scheduler checks for due batches. Small relative to
  // BATCH_INTERVAL_MINUTES so due/overdue batches are picked up promptly.
  SCHEDULER_TICK_INTERVAL_MS: 30 * 1000,
  // Retry policy for transient per-recipient send failures (429, 5xx, network/timeout).
  // Total attempts per recipient = 1 + MAX_RETRIES. Delay before retry N is
  // INITIAL_BACKOFF_MS * BACKOFF_MULTIPLIER^(N-1).
  MAX_RETRIES: 2,
  INITIAL_BACKOFF_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
};
