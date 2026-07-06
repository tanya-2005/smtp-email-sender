import { CheckCircle2, AlertCircle } from 'lucide-react';

const MODE_LABELS = {
  single: 'Single Email',
  bulk: 'Bulk Email',
  csv: 'CSV Personalization',
};

function CampaignSummary({
  mode,
  senderEmail,
  recipientCount,
  attachmentCount,
  variableCount,
  estimatedEmails,
  isFormValid,
  validationMessage,
}) {
  const rows = [
    { label: 'Campaign Type', value: MODE_LABELS[mode] },
    { label: 'Sender Email', value: senderEmail || '—' },
    { label: 'Recipients', value: recipientCount },
    { label: 'Attachments', value: attachmentCount },
    { label: 'Variables Detected', value: variableCount },
  ];

  return (
    <div className="campaign-summary">
      {rows.map((row) => (
        <div className="campaign-summary__row" key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
      <div className="campaign-summary__row campaign-summary__row--highlight">
        <span>Estimated Emails</span>
        <strong>{estimatedEmails}</strong>
      </div>

      <div className={`campaign-summary__status${isFormValid ? ' campaign-summary__status--ready' : ''}`}>
        {isFormValid ? (
          <>
            <CheckCircle2 size={14} />
            Ready to Send
          </>
        ) : (
          <>
            <AlertCircle size={14} />
            {validationMessage || 'Needs Attention'}
          </>
        )}
      </div>
    </div>
  );
}

export default CampaignSummary;
