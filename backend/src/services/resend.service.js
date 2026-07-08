const RESEND_API_BASE = 'https://api.resend.com';
const REQUEST_TIMEOUT_MS = 15000;

function normalizeAttachment(attachment) {
  const content = Buffer.isBuffer(attachment.content) ? attachment.content.toString('base64') : attachment.content;
  const normalized = { filename: attachment.filename, content };
  if (attachment.contentType) normalized.content_type = attachment.contentType;
  return normalized;
}

async function resendRequest(path, { method = 'GET', apiKey, body } = {}) {
  let response;

  try {
    response = await fetch(`${RESEND_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(err.name === 'TimeoutError' ? 'Resend API request timed out' : err.message);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Resend API error (${response.status})`);
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
}

async function sendEmail({ apiKey, from, to, subject, text, html, attachments }) {
  const payload = { from, to, subject, text, html };

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments.map(normalizeAttachment);
  }

  const data = await resendRequest('/emails', { method: 'POST', apiKey, body: payload });
  return { messageId: data.id };
}

async function verifyApiKey(apiKey) {
  if (!apiKey) {
    throw new Error('Resend API key is required');
  }

  try {
    await resendRequest('/domains', { apiKey });
  } catch (err) {
    // A 403, or a 401 whose message says the key is scope-restricted, means
    // the key itself is valid but can't read domains (e.g. a "sending
    // access"-only key, which Resend rejects from /domains with 401 and a
    // message like "This API key is restricted to only send emails") - not
    // an actual authentication failure.
    const isScopeRestricted = err.status === 403 || (err.status === 401 && /restricted/i.test(err.message));
    if (isScopeRestricted) return;
    throw err;
  }
}

module.exports = { sendEmail, verifyApiKey };
