import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, RefreshCw, ScrollText, XCircle } from 'lucide-react';
import { getWebhookLogs } from '../api/webhookApi';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import { useToast } from '../hooks/useToast';
import Section from './ui/Section';
import EmptyState from './ui/EmptyState';
import Skeleton from './ui/Skeleton';

function WebhookLogItem({ log }) {
  const success = log.status === 'success';

  return (
    <li className="webhook-log-card">
      <div className="webhook-log-card__header">
        <span className={`webhook-log-badge${success ? ' webhook-log-badge--success' : ' webhook-log-badge--failed'}`}>
          {success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {success ? 'Success' : 'Failed'}
        </span>
        <span className="webhook-log-card__timestamp">{new Date(log.timestamp).toLocaleString()}</span>
      </div>

      <div className="webhook-log-card__row">
        <strong>Recipient</strong>
        <span>{log.recipientEmail || '—'}</span>
      </div>
      <div className="webhook-log-card__row">
        <strong>Subject</strong>
        <span>{log.subject || '—'}</span>
      </div>
      <div className="webhook-log-card__row">
        <strong>Message ID</strong>
        <span>{log.messageId || '—'}</span>
      </div>
      {!success && (
        <div className="webhook-log-card__row">
          <strong>Error</strong>
          <span className="webhook-log-card__error">{log.error}</span>
        </div>
      )}

      <details className="json-viewer">
        <summary>
          <ChevronDown size={13} />
          View payload
        </summary>
        <pre>{JSON.stringify(log.payload, null, 2)}</pre>
      </details>
    </li>
  );
}

function WebhookLogsPage() {
  const showToast = useToast();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  function loadLogs({ silent = false } = {}) {
    if (silent) setIsRefreshing(true);
    return getWebhookLogs()
      .then(setLogs)
      .catch((error) => showToast({ type: 'error', message: extractErrorMessage(error) }))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const action = (
    <button
      type="button"
      className="btn btn--icon"
      onClick={() => loadLogs({ silent: true })}
      disabled={isRefreshing}
      aria-label="Refresh logs"
    >
      <RefreshCw size={15} className={isRefreshing ? 'spinner' : ''} />
    </button>
  );

  return (
    <div className="panel">
      <Section icon={ScrollText} title="Webhook Logs" action={action}>
        {isLoading ? (
          <Skeleton rows={4} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No webhook requests received yet."
            subtitle="Requests sent to the webhook endpoint will appear here."
          />
        ) : (
          <ul className="webhook-logs">
            {logs.map((log) => (
              <WebhookLogItem key={log.id} log={log} />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

export default WebhookLogsPage;
