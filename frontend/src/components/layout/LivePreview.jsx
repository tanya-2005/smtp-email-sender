import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { personalize } from '../../utils/personalize';
import { isValidEmail } from '../../utils/isValidEmail';
import EmptyState from '../ui/EmptyState';

function buildRecipientOptions(mode, singleTo, bulkRecipients, csvRows) {
  if (mode === 'single') {
    return singleTo.trim() ? [{ key: 'single', label: singleTo, data: { email: singleTo } }] : [];
  }
  if (mode === 'bulk') {
    return bulkRecipients
      .map((email, index) => ({ email: email.trim(), index }))
      .filter((entry) => entry.email)
      .map((entry) => ({
        key: `bulk-${entry.index}`,
        label: entry.email,
        data: { email: entry.email },
      }));
  }
  return csvRows.map((row) => ({
    key: String(row._id),
    label: row.name ? `${row.name} <${row.email || 'no email'}>` : row.email || 'no email',
    invalid: !isValidEmail(row.email),
    data: row,
  }));
}

function LivePreview({ mode, subject, message, singleTo, bulkRecipients, csvRows }) {
  const options = buildRecipientOptions(mode, singleTo, bulkRecipients, csvRows);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    setSelectedKey((prev) => (options.some((option) => option.key === prev) ? prev : options[0]?.key ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.map((option) => option.key).join(',')]);

  const selected = options.find((option) => option.key === selectedKey) || options[0];
  const data = selected?.data || {};

  if (options.length === 0 || !subject.trim() || !message.trim()) {
    return (
      <EmptyState
        icon={Eye}
        title="Nothing to preview yet"
        subtitle="Add recipients and fill in a subject and message to see a live preview."
      />
    );
  }

  return (
    <div className="live-preview">
      {options.length > 1 && (
        <select
          className="live-preview__select"
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
    </div>
  );
}

export default LivePreview;
