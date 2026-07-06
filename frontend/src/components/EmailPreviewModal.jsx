import { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { personalize } from '../utils/personalize';
import { isValidEmail } from '../utils/isValidEmail';
import EmptyState from './ui/EmptyState';

function buildRecipientOptions(mode, singleTo, bulkRecipients, csvRows) {
  if (mode === 'single') {
    return singleTo ? [{ key: 'single', label: singleTo, data: { email: singleTo } }] : [];
  }
  if (mode === 'bulk') {
    return bulkRecipients
      .filter((email) => email.trim())
      .map((email) => ({ key: email, label: email, data: { email } }));
  }
  return csvRows.map((row) => ({
    key: String(row._id),
    label: row.name ? `${row.name} <${row.email || 'no email'}>` : row.email || 'no email',
    invalid: !isValidEmail(row.email),
    data: row,
  }));
}

function EmailPreviewModal({ open, onClose, mode, subject, message, singleTo, bulkRecipients, csvRows }) {
  const options = buildRecipientOptions(mode, singleTo, bulkRecipients, csvRows);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    if (open) setSelectedKey(options[0]?.key ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length]);

  if (!open) return null;

  const selected = options.find((option) => option.key === selectedKey) || options[0];
  const data = selected?.data || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h2>Email Preview</h2>
          <button type="button" className="btn btn--icon" onClick={onClose} aria-label="Close preview">
            <X size={18} />
          </button>
        </div>

        {options.length > 1 && (
          <select
            className="modal__recipient-select"
            value={selectedKey ?? ''}
            onChange={(event) => setSelectedKey(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
                {option.invalid ? ' (invalid email)' : ''}
              </option>
            ))}
          </select>
        )}

        {options.length === 0 || !subject || !message ? (
          <EmptyState
            icon={Eye}
            title="Nothing to preview yet"
            subtitle="Add recipients and fill in a subject and message to see a live preview."
          />
        ) : (
          <div className="email-preview">
            <div className="email-preview__meta">
              <span className="email-preview__meta-label">To</span>
              <span>{data.email || selected.label}</span>
            </div>
            <div className="email-preview__meta">
              <span className="email-preview__meta-label">Subject</span>
              <span>{personalize(subject, data)}</span>
            </div>
            <div className="email-preview__body">{personalize(message, data)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailPreviewModal;
