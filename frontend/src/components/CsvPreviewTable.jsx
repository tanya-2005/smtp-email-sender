import { X } from 'lucide-react';
import { isValidEmail } from '../utils/isValidEmail';

function CsvPreviewTable({ headers, rows, onRemove }) {
  if (rows.length === 0) return null;

  return (
    <div className="csv-preview">
      <div className="csv-preview__table-wrapper">
        <table className="csv-preview__table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
              <th aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const invalid = !isValidEmail(row.email);
              return (
                <tr key={row._id} className={invalid ? 'csv-preview__row--invalid' : ''}>
                  {headers.map((header) => (
                    <td key={header}>{row[header]}</td>
                  ))}
                  <td>
                    <button
                      type="button"
                      className="csv-preview__remove"
                      onClick={() => onRemove(row._id)}
                      aria-label={`Remove row for ${row.email || 'unknown'}`}
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CsvPreviewTable;
