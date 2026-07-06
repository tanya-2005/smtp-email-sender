import { CheckCircle2, XCircle } from 'lucide-react';

function SenderCard({ email, status }) {
  return (
    <div className="sender-card">
      <span className="sender-card__label">From</span>
      {status === 'loading' && <span className="sender-card__email">Loading…</span>}
      {status === 'connected' && (
        <>
          <span className="sender-card__email" title={email}>
            {email}
          </span>
          <span className="sender-card__status sender-card__status--ok">
            <CheckCircle2 size={13} />
            SMTP Connected
          </span>
        </>
      )}
      {status === 'error' && (
        <span className="sender-card__status sender-card__status--error">
          <XCircle size={13} />
          Not connected
        </span>
      )}
    </div>
  );
}

export default SenderCard;
