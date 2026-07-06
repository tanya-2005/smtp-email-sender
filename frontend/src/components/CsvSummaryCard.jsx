import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { isValidEmail } from '../utils/isValidEmail';

function CsvSummaryCard({ headers, rows, maxRecipients }) {
  if (rows.length === 0) return null;

  const validCount = rows.filter((row) => isValidEmail(row.email)).length;
  const invalidCount = rows.length - validCount;
  const overLimit = rows.length > maxRecipients;

  return (
    <div className={`csv-summary${overLimit ? ' csv-summary--warning' : ''}`}>
      <div className="csv-summary__title">
        <CheckCircle2 size={16} />
        CSV Loaded
      </div>
      <div className="csv-summary__row">
        <span>Recipients</span>
        <strong>{rows.length}</strong>
      </div>
      <div className="csv-summary__row">
        <span>Valid / Invalid</span>
        <strong>
          {validCount} valid
          {invalidCount > 0 && <span className="csv-summary__invalid"> / {invalidCount} invalid</span>}
        </strong>
      </div>
      <div className="csv-summary__row csv-summary__row--variables">
        <span>Variables</span>
        <strong>{headers.join(', ')}</strong>
      </div>

      {overLimit && (
        <div className="csv-summary__warning">
          <AlertTriangle size={14} />
          Maximum {maxRecipients} recipients allowed.
        </div>
      )}
    </div>
  );
}

export default CsvSummaryCard;
