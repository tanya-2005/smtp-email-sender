import { useEffect, useRef, useState } from 'react';
import { getSender, sendEmail, sendBulkEmail, sendPersonalizedEmail } from '../api/emailApi';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import { partitionFiles, MAX_FILE_SIZE_BYTES } from '../utils/fileValidation';
import { parseCsvFile } from '../utils/csvParser';
import { isValidEmail } from '../utils/isValidEmail';
import { applyToField, insertAtCursor, prefixLines, wrapSelection } from '../utils/textEditing';
import { useToast } from '../components/ui/ToastProvider';

const INITIAL_FORM = { to: '', subject: '', message: '' };
const MAX_ATTACHMENTS = 10;
const MAX_RECIPIENTS = 150;

export function useEmailComposer() {
  const showToast = useToast();
  const [mode, setMode] = useState('single');
  const [form, setForm] = useState(INITIAL_FORM);
  const [recipients, setRecipients] = useState(['']);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [isParsingCsv, setIsParsingCsv] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [summary, setSummary] = useState(null);
  const [lastSuccess, setLastSuccess] = useState(null);
  const [activeField, setActiveField] = useState('message');
  const [senderEmail, setSenderEmail] = useState(null);
  const [senderStatus, setSenderStatus] = useState('loading');

  const subjectRef = useRef(null);
  const messageRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    getSender()
      .then((data) => {
        if (cancelled) return;
        if (data.email) {
          setSenderEmail(data.email);
          setSenderStatus('connected');
        } else {
          setSenderStatus('error');
        }
      })
      .catch(() => {
        if (!cancelled) setSenderStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setSummary(null);
    setLastSuccess(null);
  }

  function dismissSuccess() {
    setLastSuccess(null);
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

  async function handleCsvFiles(fileList) {
    const file = fileList[0];
    if (!file) return;

    setIsParsingCsv(true);
    try {
      const { headers, rows } = await parseCsvFile(file);
      setCsvHeaders(headers);
      setCsvRows(rows);
    } catch (error) {
      setCsvHeaders([]);
      setCsvRows([]);
      showToast({ type: 'error', message: error.message });
    } finally {
      setIsParsingCsv(false);
    }
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

    setAttachments((prev) => {
      const existingKeys = new Set(prev.map((file) => `${file.name}:${file.size}`));
      const deduped = accepted.filter((file) => !existingKeys.has(`${file.name}:${file.size}`));
      const combined = [...prev, ...deduped];

      if (combined.length > MAX_ATTACHMENTS) {
        showToast({
          type: 'error',
          message: `Only the first ${MAX_ATTACHMENTS} attachments were kept (max ${MAX_ATTACHMENTS}).`,
        });
      }

      return combined.slice(0, MAX_ATTACHMENTS);
    });

    if (rejected.length > 0) {
      showToast({ type: 'error', message: `Some files were not added: ${rejected.join(', ')}` });
    }
  }

  function removeAttachment(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function openAttachmentPicker() {
    fileInputRef.current?.click();
  }

  function insertVariable(header) {
    const ref = activeField === 'subject' ? subjectRef : messageRef;
    const el = ref.current;
    if (!el) return;
    const result = insertAtCursor(el, `{{${header}}}`);
    applyToField(el, (value) => setForm((prev) => ({ ...prev, [activeField]: value })), result);
  }

  function applyMessageFormat(type) {
    const el = messageRef.current;
    if (!el) return;
    const setValue = (value) => setForm((prev) => ({ ...prev, message: value }));

    let result;
    if (type === 'bold') result = wrapSelection(el, '**');
    else if (type === 'italic') result = wrapSelection(el, '*');
    else if (type === 'underline') result = wrapSelection(el, '_');
    else if (type === 'bullet') result = prefixLines(el, (line) => (line ? `- ${line}` : line));
    else if (type === 'number')
      result = prefixLines(el, (line, i) => (line ? `${i + 1}. ${line}` : line));

    applyToField(el, setValue, result);
  }

  function insertEmoji(emoji) {
    const el = messageRef.current;
    if (!el) return;
    const result = insertAtCursor(el, emoji);
    applyToField(el, (value) => setForm((prev) => ({ ...prev, message: value })), result);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSending(true);
    setSummary(null);
    setLastSuccess(null);
    const attachmentsCount = attachments.length;

    try {
      if (mode === 'bulk') {
        const cleanedRecipients = recipients.map((email) => email.trim()).filter(Boolean);
        const result = await sendBulkEmail({
          recipients: cleanedRecipients,
          subject: form.subject,
          message: form.message,
          attachments,
        });
        showToast({
          type: result.failed > 0 ? 'error' : 'success',
          message: `Sent ${result.successful} of ${result.total} emails successfully.`,
        });
        if (result.failed === 0) {
          setLastSuccess({ mode, sentCount: result.successful, attachmentsCount, timestamp: new Date() });
          setForm(INITIAL_FORM);
          setRecipients(['']);
          resetAttachments();
        } else {
          setSummary(result);
        }
      } else if (mode === 'csv') {
        const result = await sendPersonalizedEmail({
          recipients: csvRows,
          subject: form.subject,
          message: form.message,
          attachments,
        });
        showToast({
          type: result.failed > 0 ? 'error' : 'success',
          message: `Sent ${result.successful} of ${result.total} emails successfully.`,
        });
        if (result.failed === 0) {
          setLastSuccess({ mode, sentCount: result.successful, attachmentsCount, timestamp: new Date() });
          setForm(INITIAL_FORM);
          setCsvHeaders([]);
          setCsvRows([]);
          resetAttachments();
        } else {
          setSummary(result);
        }
      } else {
        await sendEmail({ ...form, attachments });
        showToast({ type: 'success', message: 'Email sent successfully!' });
        setLastSuccess({ mode, sentCount: 1, attachmentsCount, timestamp: new Date() });
        setForm(INITIAL_FORM);
        resetAttachments();
      }
    } catch (error) {
      showToast({ type: 'error', message: extractErrorMessage(error) });
    } finally {
      setIsSending(false);
    }
  }

  const recipientCount =
    mode === 'single'
      ? form.to.trim()
        ? 1
        : 0
      : mode === 'bulk'
        ? recipients.map((email) => email.trim()).filter(Boolean).length
        : csvRows.length;

  const estimatedEmails =
    mode === 'single'
      ? isValidEmail(form.to.trim())
        ? 1
        : 0
      : mode === 'bulk'
        ? recipients.map((email) => email.trim()).filter(isValidEmail).length
        : csvRows.filter((row) => isValidEmail(row.email)).length;

  const hasContent = Boolean(form.subject.trim()) && Boolean(form.message.trim());
  const csvOverLimit = mode === 'csv' && csvRows.length > MAX_RECIPIENTS;

  const filledBulkRecipients = recipients.map((email) => email.trim()).filter(Boolean);
  const bulkRecipientsValid =
    filledBulkRecipients.length > 0 && filledBulkRecipients.every(isValidEmail);

  const isFormValid =
    hasContent &&
    !csvOverLimit &&
    (mode === 'single'
      ? isValidEmail(form.to.trim())
      : mode === 'bulk'
        ? bulkRecipientsValid
        : estimatedEmails > 0);

  return {
    mode,
    handleModeChange,
    form,
    handleChange,
    recipients,
    handleRecipientChange,
    addRecipient,
    removeRecipient,
    csvHeaders,
    csvRows,
    isParsingCsv,
    handleCsvFiles,
    removeCsvRow,
    attachments,
    handleFiles,
    removeAttachment,
    openAttachmentPicker,
    fileInputRef,
    isSending,
    summary,
    lastSuccess,
    dismissSuccess,
    handleSubmit,
    senderEmail,
    senderStatus,
    activeField,
    setActiveField,
    subjectRef,
    messageRef,
    insertVariable,
    applyMessageFormat,
    insertEmoji,
    recipientCount,
    estimatedEmails,
    maxAttachmentSizeBytes: MAX_FILE_SIZE_BYTES,
    isFormValid,
    csvOverLimit,
    maxRecipients: MAX_RECIPIENTS,
  };
}
