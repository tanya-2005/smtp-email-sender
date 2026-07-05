function BulkSummary({ summary }) {
  if (!summary) return null;

  const failedResults = summary.results.filter((r) => r.status === 'failed');

  return (
    <div className="bulk-summary">
      <div className="bulk-summary__stats">
        <div className="bulk-summary__stat">
          <strong>{summary.total}</strong>
          <span>Total</span>
        </div>
        <div className="bulk-summary__stat bulk-summary__stat--success">
          <strong>{summary.successful}</strong>
          <span>Sent</span>
        </div>
        <div className="bulk-summary__stat bulk-summary__stat--failed">
          <strong>{summary.failed}</strong>
          <span>Failed</span>
        </div>
      </div>

      {failedResults.length > 0 && (
        <ul className="bulk-summary__failed-list">
          {failedResults.map((r) => (
            <li key={r.email}>
              <strong>{r.email}</strong>: {r.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BulkSummary;
