import { CheckCircle2, RotateCcw } from 'lucide-react';

const MODE_LABELS = {
  single: 'Single Email',
  bulk: 'Bulk Email',
  csv: 'CSV Personalization',
};

function SuccessScreen({ result, senderEmail, onReset }) {
  const { mode, sentCount, attachmentsCount, timestamp } = result;
  const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const rows = [
    { label: 'Campaign Type', value: MODE_LABELS[mode] },
    { label: 'Sender', value: senderEmail || '—' },
    { label: 'Recipients Sent', value: sentCount },
    { label: 'Attachments', value: attachmentsCount },
    { label: 'Time', value: time },
  ];

  return (
    <div className="success-screen">
      <div className="success-screen__icon">
        <CheckCircle2 size={36} />
      </div>
      <h2 className="success-screen__title">Emails Sent Successfully</h2>

      <div className="success-screen__details">
        {rows.map((row) => (
          <div className="success-screen__row" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn--primary" onClick={onReset}>
        <RotateCcw size={15} />
        Send Another Campaign
      </button>
    </div>
  );
}

export default SuccessScreen;
