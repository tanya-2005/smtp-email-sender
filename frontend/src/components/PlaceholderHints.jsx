import { Variable } from 'lucide-react';
import EmptyState from './ui/EmptyState';

function PlaceholderHints({ headers }) {
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
        <code key={header} className="placeholder-hints__chip">{`{{${header}}}`}</code>
      ))}
    </div>
  );
}

export default PlaceholderHints;
