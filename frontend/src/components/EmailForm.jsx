import { useRef, useState } from 'react';
import { sendEmail, sendBulkEmail } from '../api/emailApi';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import { partitionFiles } from '../utils/fileValidation';
import Notification from './Notification';
import RecipientListInput from './RecipientListInput';
import BulkSummary from './BulkSummary';

const INITIAL_FORM = { to: '', subject: '', message: '' };

function EmailForm() {
  const [mode, setMode] = useState('single');
  const [form, setForm] = useState(INITIAL_FORM);
  const [recipients, setRecipients] = useState(['']);
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState(null);
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setNotification(null);
    setSummary(null);
  }

  function handleRecipientChange(index, value) {
    setRecipients((prev) => prev.map((email, i) => (i === index ? value : email)));
  }

  function addRecipient() {
    setRecipients((prev) => [...prev, '']);
  }

  function removeRecipient(index) {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  }

  function resetAttachments() {
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(event) {
    const { accepted, rejected } = partitionFiles(Array.from(event.target.files));
    setAttachments(accepted);

    if (rejected.length > 0) {
      setNotification({
        type: 'error',
        message: `Some files were not added: ${rejected.join(', ')}`,
      });

      const dataTransfer = new DataTransfer();
      accepted.forEach((file) => dataTransfer.items.add(file));
      event.target.files = dataTransfer.files;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSending(true);
    setNotification(null);
    setSummary(null);

    try {
      if (mode === 'bulk') {
        const cleanedRecipients = recipients.map((email) => email.trim()).filter(Boolean);
        const result = await sendBulkEmail({
          recipients: cleanedRecipients,
          subject: form.subject,
          message: form.message,
          attachments,
        });
        setSummary(result);
        setNotification({
          type: result.failed > 0 ? 'error' : 'success',
          message: `Sent ${result.successful} of ${result.total} emails successfully.`,
        });
        if (result.failed === 0) {
          setForm(INITIAL_FORM);
          setRecipients(['']);
          resetAttachments();
        }
      } else {
        await sendEmail({ ...form, attachments });
        setNotification({ type: 'success', message: 'Email sent successfully!' });
        setForm(INITIAL_FORM);
        resetAttachments();
      }
    } catch (error) {
      setNotification({ type: 'error', message: extractErrorMessage(error) });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="email-card">
      <h1 className="email-card__title">Send an Email</h1>

      <div className="mode-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'single'}
          className={mode === 'single' ? 'active' : ''}
          onClick={() => handleModeChange('single')}
        >
          Single Recipient
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'bulk'}
          className={mode === 'bulk' ? 'active' : ''}
          onClick={() => handleModeChange('bulk')}
        >
          Bulk Email
        </button>
      </div>

      <Notification
        type={notification?.type}
        message={notification?.message}
        onDismiss={() => setNotification(null)}
      />

      <BulkSummary summary={summary} />

      <form onSubmit={handleSubmit} className="email-form">
        {mode === 'single' ? (
          <div className="form-field">
            <label htmlFor="to">Recipient Email</label>
            <input
              id="to"
              name="to"
              type="email"
              placeholder="someone@example.com"
              value={form.to}
              onChange={handleChange}
              required
            />
          </div>
        ) : (
          <div className="form-field">
            <label>Recipient Emails</label>
            <RecipientListInput
              recipients={recipients}
              onChange={handleRecipientChange}
              onAdd={addRecipient}
              onRemove={removeRecipient}
            />
          </div>
        )}

        <div className="form-field">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            name="subject"
            type="text"
            placeholder="Email subject"
            value={form.subject}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows={6}
            placeholder="Write your message here..."
            value={form.message}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="attachments">Attachments</label>
          <input
            id="attachments"
            name="attachments"
            type="file"
            className="file-input"
            multiple
            accept=".pdf,.docx,image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          <span className="file-hint">PDF, DOCX, or images. Max 10 MB per file.</span>

          {attachments.length > 0 && (
            <ul className="file-list">
              {attachments.map((file) => (
                <li key={file.name + file.size}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit" className="submit-button" disabled={isSending}>
          {isSending ? 'Sending...' : mode === 'bulk' ? 'Send Bulk Email' : 'Send Email'}
        </button>
      </form>
    </div>
  );
}

export default EmailForm;
