import { useState } from 'react';
import { sendEmail } from '../api/emailApi';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import Notification from './Notification';

const INITIAL_FORM = { to: '', subject: '', message: '' };

function EmailForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSending(true);
    setNotification(null);

    try {
      await sendEmail(form);
      setNotification({ type: 'success', message: 'Email sent successfully!' });
      setForm(INITIAL_FORM);
    } catch (error) {
      setNotification({ type: 'error', message: extractErrorMessage(error) });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="email-card">
      <h1 className="email-card__title">Send an Email</h1>

      <Notification
        type={notification?.type}
        message={notification?.message}
        onDismiss={() => setNotification(null)}
      />

      <form onSubmit={handleSubmit} className="email-form">
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

        <button type="submit" className="submit-button" disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Email'}
        </button>
      </form>
    </div>
  );
}

export default EmailForm;
