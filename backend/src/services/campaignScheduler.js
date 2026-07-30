const campaignService = require('./campaign.service');
const mailerService = require('./mailer.service');
const personalize = require('../utils/personalize');
const isValidEmail = require('../utils/isValidEmail');
const { SCHEDULER_TICK_INTERVAL_MS, MAX_RETRIES, INITIAL_BACKOFF_MS, BACKOFF_MULTIPLIER } = require('../config/limits');

const ACTIVE_STATUSES = ['pending', 'in_progress'];

let intervalHandle = null;
let isProcessing = false; // in-process mutex: only one tick may process batches at a time

function recipientEmail(campaign, recipient) {
  return campaign.type === 'personalized' ? recipient?.email : recipient;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A fresh disk read of just this campaign's current status - used at decision points during
// an in-flight tick to detect a cancellation that arrived via the HTTP endpoint mid-batch.
// The scheduler's own in-memory `campaign` object can otherwise go stale across the awaits
// inside a recipient's send, so this is what "sees" a concurrent cancellation.
function isCancelled(campaignId) {
  const fresh = campaignService.getCampaign(campaignId);
  return fresh?.status === 'cancelled';
}

// Transient: never got a response (network/timeout), got rate-limited (429), or the
// provider had a server-side problem (5xx). Permanent: any other 4xx (bad request, auth
// failure, invalid recipient), or an error that never reached the network at all (e.g.
// "Sender Account not configured" - providerStatus/isNetworkError both undefined, retrying
// won't help until the user fixes their settings).
function isTransientError(err) {
  if (err.isNetworkError) return true;
  const status = err.providerStatus;
  if (status === undefined) return false;
  return status === 429 || status >= 500;
}

// Sends one recipient with exponential backoff on transient failures. Never throws - always
// resolves to a single outcome, so the caller pushes exactly one result per recipient no
// matter how many attempts it took. Every attempt is recorded in retryLog for debugging.
async function sendWithRetry(sendArgs) {
  const retryLog = [];
  const maxAttempts = 1 + MAX_RETRIES;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const info = await mailerService.sendMail(sendArgs);
      return { status: 'success', messageId: info.messageId, attempts: attempt, retryLog };
    } catch (err) {
      const transient = isTransientError(err);
      const isLastAttempt = attempt === maxAttempts;

      if (!transient || isLastAttempt) {
        retryLog.push({ attempt, error: err.message, transient, timestamp: new Date().toISOString() });
        return { status: 'failed', error: err.message, attempts: attempt, retryLog };
      }

      const delayMs = INITIAL_BACKOFF_MS * BACKOFF_MULTIPLIER ** (attempt - 1);
      retryLog.push({ attempt, error: err.message, transient, delayMs, timestamp: new Date().toISOString() });
      await sleep(delayMs);
    }
  }
}

// Sends to whichever recipients in this batch don't already have a result - covers both a
// fresh batch (no results yet) and a batch resumed after a crash (some results already
// recorded). Each result is persisted immediately after that recipient's retry sequence
// concludes, so a crash partway through never causes a recipient to be re-sent to on resume.
//
// Returns true if every recipient in the batch now has a result, false if it was cut short by
// a cancellation. Checks for cancellation twice per recipient: before starting a new send (so
// a cancellation stops any *further* recipients), and again right after a send resolves but
// before persisting its result (so that save can never overwrite a cancellation that arrived
// while the send was in flight - without this second check, the in-memory `campaign.status`
// used by that save would still be stale). An already in-flight send is always allowed to
// finish and its result is always recorded; nothing is ever sent twice.
async function sendBatchRecipients(campaign, batch) {
  const attachments = campaignService.readCampaignAttachments(campaign);
  const alreadyProcessed = new Set(batch.results.map((r) => r.email));

  for (const recipient of batch.recipients) {
    if (isCancelled(campaign.id)) {
      campaign.status = 'cancelled';
      return false;
    }

    const email = recipientEmail(campaign, recipient);
    if (alreadyProcessed.has(email)) continue;

    let outcome;

    if (campaign.type === 'personalized' && !isValidEmail(email)) {
      outcome = { status: 'failed', error: 'Invalid or missing email address - skipped', attempts: 0, retryLog: [] };
    } else {
      outcome = await sendWithRetry({
        to: email,
        subject: campaign.type === 'personalized' ? personalize(campaign.subject, recipient) : campaign.subject,
        text: campaign.type === 'personalized' ? personalize(campaign.text, recipient) : campaign.text,
        html: campaign.type === 'personalized' ? personalize(campaign.html, recipient) : campaign.html,
        attachments,
      });
    }

    if (isCancelled(campaign.id)) {
      campaign.status = 'cancelled';
    }

    batch.results.push({ email: email || '(missing email)', ...outcome });
    campaignService.saveCampaign(campaign);

    if (campaign.status === 'cancelled') return false;
  }

  return true;
}

// Processes one batch: claim it (in_progress, persisted) before sending anything, then send,
// then mark it completed. Safe to call on a batch that's already partially in_progress.
async function processBatch(campaign, batch) {
  if (batch.status === 'pending') {
    batch.status = 'in_progress';
    batch.startedAt = new Date().toISOString();
  }
  if (campaign.status === 'pending') {
    campaign.status = 'in_progress';
  }
  campaignService.saveCampaign(campaign);

  const fullyProcessed = await sendBatchRecipients(campaign, batch);

  // If cancelled partway through, leave the batch as in_progress rather than falsely
  // claiming it completed - some of its recipients never got a result.
  if (fullyProcessed) {
    batch.status = 'completed';
    batch.completedAt = new Date().toISOString();
  }
  // Never let this recompute clobber a cancellation synced in during sendBatchRecipients.
  if (campaign.status !== 'cancelled') {
    campaign.status = campaign.batches.every((b) => b.status === 'completed') ? 'completed' : 'in_progress';
  }
  campaignService.saveCampaign(campaign);
}

// Walks a campaign's batches in order, sending every batch whose scheduledAt has passed.
// Stops at the first batch that isn't due yet, so batches never run out of order and a
// not-yet-due batch keeps its original schedule even if earlier batches were overdue. Also
// stops immediately (without starting the next batch) if the campaign has been cancelled -
// on future ticks this campaign is excluded entirely by tick()'s ACTIVE_STATUSES filter, so
// this check only matters for a cancellation that arrives mid-flight during the current tick.
async function processCampaignDueBatches(campaign) {
  const now = Date.now();

  for (const batch of campaign.batches) {
    if (isCancelled(campaign.id)) break;
    if (batch.status === 'completed') continue;
    if (new Date(batch.scheduledAt).getTime() > now) break;

    await processBatch(campaign, batch);
  }
}

async function tick() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const dueCampaigns = campaignService.listCampaigns().filter((c) => ACTIVE_STATUSES.includes(c.status));

    for (const campaign of dueCampaigns) {
      await processCampaignDueBatches(campaign);
    }
  } catch (err) {
    console.error('[campaignScheduler] tick failed:', err);
  } finally {
    isProcessing = false;
  }
}

// Starts the scheduler: an immediate tick catches up on anything overdue (server restart,
// batches that came due while the process was down), then a recurring interval keeps
// checking for new due batches. Safe to call more than once - later calls are a no-op.
function start() {
  if (intervalHandle) return;

  tick();
  intervalHandle = setInterval(tick, SCHEDULER_TICK_INTERVAL_MS);
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = { start, stop, tick };
