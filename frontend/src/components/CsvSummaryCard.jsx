import { CheckCircle2 } from 'lucide-react';

function CsvSummaryCard({ headers, rows }) {
  if (rows.length === 0) return null;

  return (
    <div className="csv-summary">
      <div className="csv-summary__title">
        <CheckCircle2 size={16} />
        CSV Loaded
      </div>
      <div className="csv-summary__row">
        <span>Recipients</span>
        <strong>{rows.length}</strong>
      </div>
      <div className="csv-summary__row csv-summary__row--variables">
        <span>Variables</span>
        <strong>{headers.join(', ')}</strong>
      </div>
    </div>
  );
}

export default CsvSummaryCard;
