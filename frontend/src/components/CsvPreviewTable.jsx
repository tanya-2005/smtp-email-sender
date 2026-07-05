import { isValidEmail } from '../utils/isValidEmail';

function CsvPreviewTable({ headers, rows, onRemove }) {
  if (rows.length === 0) return null;

  const invalidCount = rows.filter((row) => !isValidEmail(row.email)).length;

  return (
    <div className="csv-preview">
      <div className="csv-preview__meta">
        <span>{rows.length} recipient{rows.length === 1 ? '' : 's'} imported</span>
        {invalidCount > 0 && (
          <span className="csv-preview__invalid-count">
            {invalidCount} invalid email{invalidCount === 1 ? '' : 's'} will be skipped
          </span>
        )}
      </div>

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
                      &times;
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
