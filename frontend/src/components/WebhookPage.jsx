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

const FIELDS = [
  { name: 'recipientEmail', required: 'Yes', description: 'Recipient email address.' },
  { name: 'recipientName', required: 'No', description: 'Recipient display name. Usable as {{name}} in subject/body/html.' },
  { name: 'subject', required: 'Yes', description: 'Email subject line.' },
  { name: 'body', required: 'body or html', description: 'Plain-text email content.' },
  { name: 'html', required: 'body or html', description: 'HTML email content.' },
  {
    name: 'attachments',
    required: 'No',
    description: 'Array of { filename, contentType, content }. content is base64-encoded (max 10 attachments, 10 MB each).',
  },
];

function WebhookPage({ senderEmail, senderStatus }) {
  const [copied, setCopied] = useState(false);
  const endpoint = `${apiClient.defaults.baseURL}/webhook`;

  function handleCopy() {
    navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="panel">
      <Section icon={Webhook} title="Webhook">
        <p className="section__description">
          Send emails programmatically by posting JSON to this endpoint - the primary way to send email
          through this service. The Manual Email composer remains available as a separate tool. SMTP
          credentials are never accepted in the payload; every request sends through the currently
          configured Sender Account.
        </p>

        <div className="code-block">
          <code>POST {endpoint}</code>
          <button type="button" className="btn btn--icon" onClick={handleCopy} aria-label="Copy endpoint URL">
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>

        {senderStatus !== 'connected' && (
          <p className="webhook-hint webhook-hint--warning">
            Set up your Sender Account before sending - the webhook uses those SMTP credentials.
          </p>
        )}
        {senderStatus === 'connected' && senderEmail && (
          <p className="webhook-hint">
            Emails will be sent from <strong>{senderEmail}</strong>.
          </p>
        )}
      </Section>

      <Section title="Example payload">
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
    </div>
  );
}

export default WebhookPage;
