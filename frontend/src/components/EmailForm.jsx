import {
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
import Section from './ui/Section';
import SegmentedControl from './ui/SegmentedControl';
import Dropzone from './ui/Dropzone';
import Spinner from './ui/Spinner';
import Skeleton from './ui/Skeleton';
import RecipientListInput from './RecipientListInput';
import BulkSummary from './BulkSummary';
import CsvUpload from './CsvUpload';
import CsvPreviewTable from './CsvPreviewTable';
import CsvSummaryCard from './CsvSummaryCard';
import PlaceholderHints from './PlaceholderHints';
import AttachmentList from './AttachmentList';
import MessageComposer from './MessageComposer';
import SuccessScreen from './SuccessScreen';

const MODE_OPTIONS = [
  { value: 'single', label: 'Single', icon: Mail },
  { value: 'bulk', label: 'Bulk', icon: List },
  { value: 'csv', label: 'CSV Personalization', icon: FileSpreadsheet },
];

function EmailForm({ composer }) {
  const {
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
    setActiveField,
    subjectRef,
    messageRef,
    insertVariable,
    applyMessageFormat,
    insertEmoji,
    senderEmail,
    isFormValid,
    maxRecipients,
  } = composer;

  const submitLabel =
    mode === 'bulk' ? 'Send Bulk Email' : mode === 'csv' ? 'Send Personalized Emails' : 'Send Email';

  const modeIcon = mode === 'single' ? Mail : mode === 'bulk' ? List : FileSpreadsheet;

  return (
    <div className="panel">
      <Section icon={modeIcon} title="Campaign Type">
        <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={handleModeChange} />
      </Section>

      {lastSuccess ? (
        <SuccessScreen result={lastSuccess} senderEmail={senderEmail} onReset={dismissSuccess} />
      ) : (
        <>
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
                  <CsvUpload onFiles={handleCsvFiles} />
                  {isParsingCsv ? (
                    <Skeleton rows={3} />
                  ) : (
                    <>
                      <CsvSummaryCard headers={csvHeaders} rows={csvRows} maxRecipients={maxRecipients} />
                      <CsvPreviewTable headers={csvHeaders} rows={csvRows} onRemove={removeCsvRow} />
                    </>
                  )}
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
                onFocus={() => setActiveField('subject')}
                aria-label="Email subject"
                ref={subjectRef}
                required
              />
            </Section>

            <Section icon={MessageSquare} title="Message">
              <MessageComposer
                value={form.message}
                onChange={handleChange}
                onFocus={() => setActiveField('message')}
                textareaRef={messageRef}
                onFormat={applyMessageFormat}
                onEmoji={insertEmoji}
                onAttachClick={openAttachmentPicker}
              />
            </Section>

            <Section icon={Variable} title="Detected Variables">
              <PlaceholderHints headers={mode === 'csv' ? csvHeaders : []} onInsert={insertVariable} />
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
              <AttachmentList files={attachments} onRemove={removeAttachment} />
            </Section>

            <div className="panel__footer">
              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={isSending || !isFormValid}
              >
                {isSending ? <Spinner /> : <SendIcon size={15} />}
                {isSending ? 'Sending...' : submitLabel}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default EmailForm;
