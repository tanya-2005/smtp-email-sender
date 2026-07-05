function PlaceholderHints({ headers }) {
  if (!headers || headers.length === 0) return null;

  return (
    <div className="placeholder-hints">
      <span className="placeholder-hints__label">Available placeholders:</span>
      {headers.map((header) => (
        <code key={header} className="placeholder-hints__chip">{`{{${header}}}`}</code>
      ))}
    </div>
  );
}

export default PlaceholderHints;
