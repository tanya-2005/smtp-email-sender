const MODE_LABELS = {
  single: 'Single Email',
  bulk: 'Bulk Email',
  csv: 'CSV Personalization',
};

function CampaignSummary({ mode, recipientCount, attachmentCount, variableCount, estimatedEmails }) {
  const rows = [
    { label: 'Campaign', value: MODE_LABELS[mode] },
    { label: 'Recipients', value: recipientCount },
    { label: 'Attachments', value: attachmentCount },
    { label: 'Variables', value: variableCount },
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
    </div>
  );
}

export default CampaignSummary;
