import { useRef, useState } from 'react';
import {
  Eye,
  FileSpreadsheet,
  List,
  Mail,
  MessageSquare,
  Paperclip,
  Send as SendIcon,
  Type,
  Users,
  Variable,
} from 'lucide-react';
import { sendEmail, sendBulkEmail, sendPersonalizedEmail } from '../api/emailApi';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import { partitionFiles } from '../utils/fileValidation';
import { useToast } from './ui/ToastProvider';
import Section from './ui/Section';
import SegmentedControl from './ui/SegmentedControl';
import Dropzone from './ui/Dropzone';
import Spinner from './ui/Spinner';
import RecipientListInput from './RecipientListInput';
import BulkSummary from './BulkSummary';
import CsvUpload from './CsvUpload';
import CsvPreviewTable from './CsvPreviewTable';
import CsvSummaryCard from './CsvSummaryCard';
import PlaceholderHints from './PlaceholderHints';
import EmailPreviewModal from './EmailPreviewModal';

const INITIAL_FORM = { to: '', subject: '', message: '' };

const MODE_OPTIONS = [
  { value: 'single', label: 'Single', icon: Mail },
  { value: 'bulk', label: 'Bulk', icon: List },
  { value: 'csv', label: 'CSV Personalization', icon: FileSpreadsheet },
];

function EmailForm() {
  const showToast = useToast();
  const [mode, setMode] = useState('single');
  const [form, setForm] = useState(INITIAL_FORM);
  const [recipients, setRecipients] = useState(['']);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [summary, setSummary] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleModeChange(nextMode) {
    setMode(nextMode);
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

  function handleCsvParsed({ headers, rows }) {
    setCsvHeaders(headers);
    setCsvRows(rows);
  }

  function handleCsvError(message) {
    setCsvHeaders([]);
    setCsvRows([]);
    showToast({ type: 'error', message });
  }

  function removeCsvRow(id) {
    setCsvRows((prev) => prev.filter((row) => row._id !== id));
  }

  function resetAttachments() {
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFiles(fileList) {
    const { accepted, rejected } = partitionFiles(Array.from(fileList));
    setAttachments(accepted);

    if (rejected.length > 0) {
      showToast({ type: 'error', message: `Some files were not added: ${rejected.join(', ')}` });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSending(true);
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
        showToast({
          type: result.failed > 0 ? 'error' : 'success',
          message: `Sent ${result.successful} of ${result.total} emails successfully.`,
        });
        if (result.failed === 0) {
          setForm(INITIAL_FORM);
          setRecipients(['']);
          resetAttachments();
        }
      } else if (mode === 'csv') {
        const result = await sendPersonalizedEmail({
          recipients: csvRows,
          subject: form.subject,
          message: form.message,
          attachments,
        });
        setSummary(result);
        showToast({
          type: result.failed > 0 ? 'error' : 'success',
          message: `Sent ${result.successful} of ${result.total} emails successfully.`,
        });
        if (result.failed === 0) {
          setForm(INITIAL_FORM);
          setCsvHeaders([]);
          setCsvRows([]);
          resetAttachments();
        }
      } else {
        await sendEmail({ ...form, attachments });
        showToast({ type: 'success', message: 'Email sent successfully!' });
        setForm(INITIAL_FORM);
        resetAttachments();
      }
    } catch (error) {
      showToast({ type: 'error', message: extractErrorMessage(error) });
    } finally {
      setIsSending(false);
    }
  }

  const submitLabel =
    mode === 'bulk' ? 'Send Bulk Email' : mode === 'csv' ? 'Send Personalized Emails' : 'Send Email';

  const modeIcon = mode === 'single' ? Mail : mode === 'bulk' ? List : FileSpreadsheet;
  const csvSendDisabled = mode === 'csv' && csvRows.length === 0;
  const previewDisabled = !form.subject || !form.message || (mode === 'csv' && csvRows.length === 0);

  return (
    <div className="panel">
      <Section icon={modeIcon} title="Email Mode">
        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={handleModeChange} />
      </Section>

      <BulkSummary summary={summary} />

      <form onSubmit={handleSubmit}>
        <Section icon={Users} title="Recipients">
          {mode === 'single' && (
            <input
              id="to"
              name="to"
              type="email"
              placeholder="someone@example.com"
              value={form.to}
              onChange={handleChange}
              aria-label="Recipient email"
              required
            />
          )}
          {mode === 'bulk' && (
            <RecipientListInput
              recipients={recipients}
              onChange={handleRecipientChange}
              onAdd={addRecipient}
              onRemove={removeRecipient}
            />
          )}
          {mode === 'csv' && (
            <div className="csv-section">
              <CsvUpload onParsed={handleCsvParsed} onError={handleCsvError} />
              <CsvSummaryCard headers={csvHeaders} rows={csvRows} />
              <CsvPreviewTable headers={csvHeaders} rows={csvRows} onRemove={removeCsvRow} />
            </div>
          )}
        </Section>

        <Section icon={Type} title="Subject">
          <input
            id="subject"
            name="subject"
            type="text"
            placeholder="Email subject"
            value={form.subject}
            onChange={handleChange}
            aria-label="Email subject"
            required
          />
        </Section>

        <Section icon={MessageSquare} title="Message">
          <textarea
            id="message"
            name="message"
            rows={7}
            placeholder="Write your message here..."
            value={form.message}
            onChange={handleChange}
            aria-label="Email message"
            required
          />
        </Section>

        <Section icon={Variable} title="Detected Variables">
          <PlaceholderHints headers={mode === 'csv' ? csvHeaders : []} />
        </Section>

        <Section icon={Paperclip} title="Attachments">
          <Dropzone
            id="attachments"
            multiple
            accept=".pdf,.docx,image/*"
            onFiles={handleFiles}
            inputRef={fileInputRef}
            title="Drop files here, or click to browse"
            subtitle="PDF, DOCX, or images. Max 10 MB per file."
          />
          {attachments.length > 0 && (
            <ul className="file-list">
              {attachments.map((file) => (
                <li key={file.name + file.size}>{file.name}</li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={Eye} title="Preview">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setPreviewOpen(true)}
            disabled={previewDisabled}
          >
            <Eye size={15} /> Preview Email
          </button>
        </Section>

        <div className="panel__footer">
          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={isSending || csvSendDisabled}
          >
            {isSending ? <Spinner /> : <SendIcon size={15} />}
            {isSending ? 'Sending...' : submitLabel}
          </button>
        </div>
      </form>

      <EmailPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        mode={mode}
        subject={form.subject}
        message={form.message}
        singleTo={form.to}
        bulkRecipients={recipients}
        csvRows={csvRows}
      />
    </div>
  );
}

export default EmailForm;
