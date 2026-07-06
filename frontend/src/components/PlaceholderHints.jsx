import { Variable } from 'lucide-react';
import EmptyState from './ui/EmptyState';

function PlaceholderHints({ headers, onInsert }) {
  if (!headers || headers.length === 0) {
    return (
      <EmptyState
        icon={Variable}
        title="No variables detected yet"
        subtitle="Upload a CSV to detect columns you can use as {{placeholders}} in your subject and message."
      />
    );
  }

  return (
    <div className="placeholder-hints">
      {headers.map((header) => (
        <button
          key={header}
          type="button"
          className="placeholder-hints__chip"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onInsert(header)}
        >
          {`{{${header}}}`}
        </button>
      ))}
    </div>
  );
}

export default PlaceholderHints;
