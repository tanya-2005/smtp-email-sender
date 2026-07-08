import { useState } from 'react';
import { Check, Copy, Webhook } from 'lucide-react';
import Section from './ui/Section';
import apiClient from '../api/client';

const EXAMPLE_PAYLOAD = {
  recipientEmail: 'jane@example.com',
  recipientName: 'Jane',
  subject: 'Welcome, {{name}}!',
  body: 'Hi {{name}}, thanks for signing up.',
  html: '<p>Hi {{name}}, thanks for signing up.</p>',
  attachments: [{ filename: 'invoice.pdf', contentType: 'application/pdf', content: '<base64-encoded-file>' }],
};

const SUCCESS_RESPONSE = {
  message: 'Email sent successfully',
  messageId: '<abc123@mail.example.com>',
};

const VALIDATION_ERROR_RESPONSE = {
  errors: ['"recipientEmail" is required and must be a valid email address'],
};

const FIELDS = [
  { name: 'recipientEmail', required: 'Yes', description: 'Recipient email address.' },
  { name: 'recipientName', required: 'No', description: 'Recipient display name. Usable as {{name}} in subject/body/html.' },
  {
    name: 'subject',
    required: 'No',
    description: 'Email subject line. Supports {{name}} / {{email}} placeholders. Defaults to "(No subject)" if omitted.',
  },
  { name: 'body', required: 'body or html', description: 'Plain-text email content. Supports placeholders.' },
  { name: 'html', required: 'body or html', description: 'HTML email content. Supports placeholders.' },
  {
    name: 'attachments',
    required: 'No',
    description: 'Array of { filename, contentType, content }. content is base64-encoded (max 10 attachments, 10 MB each).',
  },
];

const STATUS_CODES = [
  { code: '200', meaning: 'Email sent successfully. Response includes the Resend messageId.' },
  { code: '400', meaning: 'Payload failed validation (missing/invalid fields) or the JSON body could not be parsed. See the errors array.' },
  { code: '413', meaning: 'Request payload too large - reduce attachment size or count.' },
  { code: '502', meaning: 'Resend rejected the send (e.g. invalid API key, unverified sending domain, recipient refused).' },
  { code: '503', meaning: 'The Sender Account has not been configured yet.' },
];

function CopyBlock({ text, display, multiline }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={multiline ? 'code-block code-block--multiline' : 'code-block'}>
      {multiline ? <pre>{display}</pre> : <code>{display}</code>}
      <button type="button" className="btn btn--icon" onClick={handleCopy} aria-label="Copy to clipboard">
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
}

function WebhookPage({ senderEmail, senderStatus }) {
  const endpoint = `${apiClient.defaults.baseURL}/webhook`;

  const curlExample = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientEmail": "jane@example.com",
    "recipientName": "Jane",
    "subject": "Welcome, {{name}}!",
    "body": "Hi {{name}}, thanks for signing up."
  }'`;

  return (
    <div className="panel">
      <Section icon={Webhook} title="Webhook">
        <p className="section__description">
          Send emails programmatically by posting JSON to this endpoint - the primary way to send email
          through this service. The Manual Email composer remains available as a separate tool. Resend API
          credentials are never accepted in the payload; every request sends through the currently
          configured Sender Account.
        </p>

        <CopyBlock text={endpoint} display={`POST ${endpoint}`} />

        {senderStatus !== 'connected' && (
          <p className="webhook-hint webhook-hint--warning">
            Set up your Sender Account before sending - the webhook uses that Resend API key.
          </p>
        )}
        {senderStatus === 'connected' && senderEmail && (
          <p className="webhook-hint">
            Emails will be sent from <strong>{senderEmail}</strong>.
          </p>
        )}
      </Section>

      <Section title="Example payload">
        <p className="section__description">
          Send this as the JSON request body with header <code>Content-Type: application/json</code>.
        </p>
        <pre className="payload-example">{JSON.stringify(EXAMPLE_PAYLOAD, null, 2)}</pre>
      </Section>

      <Section title="Fields">
        <div className="csv-preview__table-wrapper">
          <table className="webhook-fields">
            <thead>
              <tr>
                <th>Field</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((field) => (
                <tr key={field.name}>
                  <td>
                    <code>{field.name}</code>
                  </td>
                  <td>{field.required}</td>
                  <td>{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Try it (cURL)">
        <CopyBlock text={curlExample} display={curlExample} multiline />
      </Section>

      <Section title="Responses">
        <p className="webhook-response-label">Success - 200</p>
        <pre className="payload-example">{JSON.stringify(SUCCESS_RESPONSE, null, 2)}</pre>
        <p className="webhook-response-label webhook-response-label--spaced">Validation error - 400</p>
        <pre className="payload-example">{JSON.stringify(VALIDATION_ERROR_RESPONSE, null, 2)}</pre>
      </Section>

      <Section title="Status codes">
        <div className="csv-preview__table-wrapper">
          <table className="webhook-fields">
            <thead>
              <tr>
                <th>Status</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_CODES.map((row) => (
                <tr key={row.code}>
                  <td>
                    <code>{row.code}</code>
                  </td>
                  <td>{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="webhook-hint">
          Every request to this endpoint - successful or not - is recorded on the Webhook Logs page,
          including the full payload received.
        </p>
      </Section>
    </div>
  );
}

export default WebhookPage;
