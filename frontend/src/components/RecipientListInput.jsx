import { Plus, X } from 'lucide-react';

function RecipientListInput({ recipients, onChange, onAdd, onRemove }) {
  return (
    <div className="recipient-list">
      {recipients.map((email, index) => (
        <div className="recipient-row" key={index}>
          <input
            type="email"
            placeholder="someone@example.com"
            value={email}
            onChange={(event) => onChange(index, event.target.value)}
            required
          />
          {recipients.length > 1 && (
            <button
              type="button"
              className="recipient-remove"
              onClick={() => onRemove(index)}
              aria-label={`Remove recipient ${index + 1}`}
            >
              <X size={15} />
            </button>
          )}
        </div>
      ))}

      <button type="button" className="recipient-add" onClick={onAdd}>
        <Plus size={14} /> Add recipient
      </button>
    </div>
  );
}

export default RecipientListInput;
