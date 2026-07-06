import { Eye, LayoutDashboard } from 'lucide-react';
import CampaignSummary from './CampaignSummary';
import LivePreview from './LivePreview';

function SummaryPanel({ composer }) {
  const {
    mode,
    recipientCount,
    attachments,
    csvHeaders,
    estimatedEmails,
    form,
    recipients,
    csvRows,
  } = composer;

  const variableCount = mode === 'csv' ? csvHeaders.length : 0;

  return (
    <aside className="summary-panel">
      <div className="summary-panel__section">
        <div className="summary-panel__title">
          <LayoutDashboard size={15} />
          Campaign Summary
        </div>
        <CampaignSummary
          mode={mode}
          recipientCount={recipientCount}
          attachmentCount={attachments.length}
          variableCount={variableCount}
          estimatedEmails={estimatedEmails}
        />
      </div>

      <div className="summary-panel__section summary-panel__section--grow">
        <div className="summary-panel__title">
          <Eye size={15} />
          Email Preview
        </div>
        <LivePreview
          mode={mode}
          subject={form.subject}
          message={form.message}
          singleTo={form.to}
          bulkRecipients={recipients}
          csvRows={csvRows}
        />
      </div>
    </aside>
  );
}

export default SummaryPanel;
