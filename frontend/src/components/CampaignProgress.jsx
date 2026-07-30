import { CheckCircle2, Clock, Loader2, RotateCcw, X, XCircle } from 'lucide-react';

const STATUS_LABELS = {
  pending: 'Queued',
  in_progress: 'Sending',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'];

function formatClockTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeMinutes(iso) {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'any moment now';
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'less than a minute';
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function CampaignProgress({ campaign, onDismiss, onCancel, isCancelling }) {
  if (!campaign) return null;

  const isCancelled = campaign.status === 'cancelled';
  const isTerminal = TERMINAL_STATUSES.includes(campaign.status);
  const statusLabel = STATUS_LABELS[campaign.status] || campaign.status;

  const stats = [
    { label: 'Total Recipients', value: campaign.totalRecipients },
    { label: 'Sent', value: campaign.sent, variant: 'success' },
    { label: 'Failed', value: campaign.failed, variant: campaign.failed > 0 ? 'failed' : undefined },
    { label: 'Remaining', value: campaign.remaining },
    { label: 'Batches', value: `${campaign.batchesCompleted} / ${campaign.totalBatches}` },
  ];

  const headerVariant = isCancelled ? ' campaign-progress__header--cancelled' : isTerminal ? ' campaign-progress__header--done' : '';

  function handleCancelClick() {
    if (window.confirm('Cancel this campaign? Recipients who have not been emailed yet will be skipped.')) {
      onCancel();
    }
  }

  return (
    <div className="campaign-progress">
      <div className={`campaign-progress__header${headerVariant}`}>
        <div className="campaign-progress__icon">
          {isCancelled ? (
            <XCircle size={20} />
          ) : isTerminal ? (
            <CheckCircle2 size={20} />
          ) : (
            <Loader2 size={20} className="spinner" />
          )}
        </div>
        <div className="campaign-progress__heading">
          <div className="campaign-progress__title">
            {isCancelled ? 'Campaign Cancelled' : isTerminal ? 'Campaign Completed' : 'Campaign In Progress'}
          </div>
          <div className="campaign-progress__status">{statusLabel}</div>
        </div>
        {!isTerminal && (
          <button
            type="button"
            className="btn btn--icon campaign-progress__close"
            onClick={onDismiss}
            aria-label="Stop watching this campaign"
            title="Stop watching (it keeps sending in the background)"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="campaign-progress__stats">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`campaign-progress__stat${stat.variant ? ` campaign-progress__stat--${stat.variant}` : ''}`}
          >
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      {!isTerminal && campaign.nextBatchAt && (
        <div className="campaign-progress__next">
          <Clock size={14} />
          Next batch at {formatClockTime(campaign.nextBatchAt)} (in about {formatRelativeMinutes(campaign.nextBatchAt)})
        </div>
      )}

      {!isTerminal && (
        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={handleCancelClick}
          disabled={isCancelling}
        >
          <XCircle size={15} />
          {isCancelling ? 'Cancelling...' : 'Cancel Campaign'}
        </button>
      )}

      {isTerminal && (
        <button type="button" className="btn btn--primary btn--block" onClick={onDismiss}>
          <RotateCcw size={15} />
          Send Another Campaign
        </button>
      )}
    </div>
  );
}

export default CampaignProgress;
