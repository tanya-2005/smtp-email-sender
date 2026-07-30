import { useEffect, useRef, useState } from 'react';
import {
  getSender,
  sendEmail,
  sendBulkEmail,
  sendPersonalizedEmail,
  getCampaignStatus,
  cancelCampaign as cancelCampaignRequest,
} from '../api/emailApi';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import { partitionFiles, MAX_FILE_SIZE_BYTES } from '../utils/fileValidation';
import { parseCsvFile } from '../utils/csvParser';
import { isValidEmail } from '../utils/isValidEmail';
import { applyToField, insertAtCursor, prefixLines, wrapSelection } from '../utils/textEditing';
import { useToast } from './useToast';

const INITIAL_FORM = { to: '', subject: '', message: '' };
const MAX_ATTACHMENTS = 10;
const MAX_RECIPIENTS = 150;
// Within the 10-15s range requested for polling a drip campaign's progress.
const CAMPAIGN_POLL_INTERVAL_MS = 12000;
// Only "completed" is ever produced by the backend today - "failed"/"cancelled" are included
// so polling still stops correctly if those are added later.
const TERMINAL_CAMPAIGN_STATUSES = ['completed', 'failed', 'cancelled'];

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
  const [campaignProgress, setCampaignProgress] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(null);
  const [activeField, setActiveField] = useState('message');
  const [senderEmail, setSenderEmail] = useState(null);
  const [senderStatus, setSenderStatus] = useState('loading');

  const subjectRef = useRef(null);
  const messageRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  function stopCampaignPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  // Runs independently of any single request - the campaign itself is driven by the
  // background scheduler on the server, this just periodically checks in on it.
  function startCampaignPolling(campaignId) {
    stopCampaignPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await getCampaignStatus(campaignId);
        setCampaignProgress(status);
        if (TERMINAL_CAMPAIGN_STATUSES.includes(status.status)) {
          stopCampaignPolling();
        }
      } catch (error) {
        // A transient network hiccup shouldn't stop polling - only give up once the
        // campaign is confirmed gone (404).
        if (error?.response?.status === 404) stopCampaignPolling();
      }
    }, CAMPAIGN_POLL_INTERVAL_MS);
  }

  useEffect(() => stopCampaignPolling, []);

  function refreshSender() {
    return getSender()
      .then((data) => {
        if (data.email && data.configured) {
          setSenderEmail(data.email);
          setSenderStatus('connected');
        } else {
          setSenderEmail(data.email || null);
          setSenderStatus('error');
        }
      })
      .catch(() => {
        setSenderStatus('error');
      });
  }

  useEffect(() => {
    refreshSender();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleModeChange(nextMode) {
    setMode(nextMode);
    stopCampaignPolling();
    setCampaignProgress(null);
    setLastSuccess(null);
  }

  function dismissSuccess() {
    setLastSuccess(null);
  }

  // Stops watching a campaign from the UI - the backend scheduler keeps sending it
  // regardless, this only affects whether this browser tab keeps polling it.
  function dismissCampaign() {
    stopCampaignPolling();
    setCampaignProgress(null);
  }

  // The confirmation prompt lives in CampaignProgress (the UI concern); this only runs once
  // the user has already confirmed. The backend response is already the final, terminal
  // summary (status: 'cancelled' with final sent/failed/remaining counts), so polling can
  // stop immediately without waiting for one more poll cycle to catch up.
  async function handleCancelCampaign() {
    if (!campaignProgress) return;

    setIsCancelling(true);
    try {
      const cancelled = await cancelCampaignRequest(campaignProgress.id);
      stopCampaignPolling();
      setCampaignProgress(cancelled);
      showToast({ type: 'success', message: 'Campaign cancelled.' });
    } catch (error) {
      showToast({ type: 'error', message: extractErrorMessage(error) });
    } finally {
      setIsCancelling(false);
    }
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
    setCampaignProgress(null);
    setLastSuccess(null);

    try {
      if (mode === 'bulk') {
        const cleanedRecipients = recipients.map((email) => email.trim()).filter(Boolean);
        const campaign = await sendBulkEmail({
          recipients: cleanedRecipients,
          subject: form.subject,
          message: form.message,
          attachments,
        });
        showToast({
          type: 'success',
          message: `Campaign created - sending ${campaign.totalRecipients} emails across ${campaign.totalBatches} batch${campaign.totalBatches === 1 ? '' : 'es'}.`,
        });
        setCampaignProgress(campaign);
        startCampaignPolling(campaign.id);
        setForm(INITIAL_FORM);
        setRecipients(['']);
        resetAttachments();
      } else if (mode === 'csv') {
        const campaign = await sendPersonalizedEmail({
          recipients: csvRows,
          subject: form.subject,
          message: form.message,
          attachments,
        });
        showToast({
          type: 'success',
          message: `Campaign created - sending ${campaign.totalRecipients} emails across ${campaign.totalBatches} batch${campaign.totalBatches === 1 ? '' : 'es'}.`,
        });
        setCampaignProgress(campaign);
        startCampaignPolling(campaign.id);
        setForm(INITIAL_FORM);
        setCsvHeaders([]);
        setCsvRows([]);
        resetAttachments();
      } else {
        const attachmentsCount = attachments.length;
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
  const senderConfigured = senderStatus === 'connected';

  const filledBulkRecipients = recipients.map((email) => email.trim()).filter(Boolean);
  const bulkRecipientsValid =
    filledBulkRecipients.length > 0 && filledBulkRecipients.every(isValidEmail);

  const isFormValid =
    senderConfigured &&
    hasContent &&
    !csvOverLimit &&
    (mode === 'single'
      ? isValidEmail(form.to.trim())
      : mode === 'bulk'
        ? bulkRecipientsValid
        : estimatedEmails > 0);

  function getValidationMessage() {
    if (!senderConfigured) return 'Set up your Sender Account before sending.';
    if (mode === 'single' && !isValidEmail(form.to.trim())) return 'Enter a valid recipient email.';
    if (mode === 'bulk' && !bulkRecipientsValid) return 'Add at least one valid recipient.';
    if (mode === 'csv' && csvRows.length === 0) return 'Upload a CSV file with recipients.';
    if (mode === 'csv' && csvOverLimit) return `Maximum ${MAX_RECIPIENTS} recipients allowed.`;
    if (mode === 'csv' && estimatedEmails === 0) return 'CSV has no valid recipients.';
    if (!form.subject.trim()) return 'Subject is required.';
    if (!form.message.trim()) return 'Message is required.';
    return null;
  }

  const validationMessage = isFormValid ? null : getValidationMessage();

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
    campaignProgress,
    dismissCampaign,
    cancelCampaign: handleCancelCampaign,
    isCancelling,
    lastSuccess,
    dismissSuccess,
    handleSubmit,
    senderEmail,
    senderStatus,
    senderConfigured,
    refreshSender,
    validationMessage,
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
